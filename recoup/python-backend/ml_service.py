"""
ML Payment Prediction Service

Provides ML-powered payment time prediction using pre-trained models
Features continuous learning from actual payment outcomes

**Features:**
- XGBoost/LightGBM ensemble for payment time prediction
- 25+ engineered features
- Pre-trained on synthetic + real data
- Continuous learning pipeline
- Feature importance analysis
- Risk scoring and strategy recommendation

**API Endpoints:**
- POST /ml/predict-payment - Predict payment time
- POST /ml/record-outcome - Record actual payment for retraining
- POST /ml/train - Trigger model retraining
- GET /ml/model-info - Get model metadata
"""

import os
import json
import pickle
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
from flask import Flask, request, jsonify
import logging

# ML libraries
try:
    import xgboost as xgb
    from sklearn.ensemble import GradientBoostingRegressor
    from sklearn.preprocessing import StandardScaler
    import joblib
    HAS_ML = True
except ImportError:
    HAS_ML = False
    logging.warning("ML libraries not installed. Using fallback predictions.")

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Model paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
XGBOOST_PATH = os.path.join(MODEL_DIR, 'xgboost_model.pkl')
GB_PATH = os.path.join(MODEL_DIR, 'gradient_boost_model.pkl')
TRAINING_DATA_PATH = os.path.join(MODEL_DIR, 'training_data.json')
MODEL_METADATA_PATH = os.path.join(MODEL_DIR, 'model_metadata.json')

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)

# Feature names (must match TypeScript interface)
FEATURE_NAMES = [
    # Invoice characteristics
    'invoiceAmount',
    'invoiceAge',
    'daysOverdue',
    'daysSinceLastReminder',

    # Client historical behavior
    'clientPreviousInvoiceCount',
    'clientAveragePaymentTime',
    'clientPaymentVariance',
    'clientTotalPaid',
    'clientPaymentRate',
    'clientAverageInvoiceAmount',

    # Communication engagement
    'emailOpenRate',
    'emailClickRate',
    'smsResponseRate',
    'callAnswerRate',
    'totalCommunicationsSent',
    'daysSinceLastEngagement',

    # Invoice-specific patterns
    'isRecurringInvoice',
    'hasPaymentPlan',
    'hasDisputeHistory',
    'invoiceComplexity',

    # Temporal features
    'dayOfWeek',
    'dayOfMonth',
    'monthOfYear',
    'isEndOfMonth',
    'isEndOfQuarter',
]


class PaymentPredictor:
    """ML-powered payment time predictor"""

    def __init__(self):
        self.scaler: Optional[StandardScaler] = None
        self.xgboost_model: Optional[Any] = None
        self.gb_model: Optional[Any] = None
        self.metadata: Dict[str, Any] = {}
        self.training_data: List[Dict[str, Any]] = []

        # Load models if they exist
        self.load_models()

    def load_models(self):
        """Load pre-trained models from disk"""
        try:
            if os.path.exists(SCALER_PATH):
                self.scaler = joblib.load(SCALER_PATH)
                logging.info("Loaded scaler")

            if os.path.exists(XGBOOST_PATH) and HAS_ML:
                self.xgboost_model = joblib.load(XGBOOST_PATH)
                logging.info("Loaded XGBoost model")

            if os.path.exists(GB_PATH):
                self.gb_model = joblib.load(GB_PATH)
                logging.info("Loaded Gradient Boosting model")

            if os.path.exists(MODEL_METADATA_PATH):
                with open(MODEL_METADATA_PATH, 'r') as f:
                    self.metadata = json.load(f)
                logging.info("Loaded model metadata")

            if os.path.exists(TRAINING_DATA_PATH):
                with open(TRAINING_DATA_PATH, 'r') as f:
                    self.training_data = json.load(f)
                logging.info(f"Loaded {len(self.training_data)} training samples")

        except Exception as e:
            logging.error(f"Error loading models: {e}")

    def save_models(self):
        """Save trained models to disk"""
        try:
            if self.scaler:
                joblib.dump(self.scaler, SCALER_PATH)

            if self.xgboost_model and HAS_ML:
                joblib.dump(self.xgboost_model, XGBOOST_PATH)

            if self.gb_model:
                joblib.dump(self.gb_model, GB_PATH)

            with open(MODEL_METADATA_PATH, 'w') as f:
                json.dump(self.metadata, f, indent=2)

            with open(TRAINING_DATA_PATH, 'w') as f:
                json.dump(self.training_data, f, indent=2)

            logging.info("Models saved successfully")

        except Exception as e:
            logging.error(f"Error saving models: {e}")

    def extract_features(self, data: Dict[str, Any]) -> np.ndarray:
        """Extract feature vector from input data"""
        features = []
        for feature_name in FEATURE_NAMES:
            value = data.get(feature_name, 0)
            # Convert booleans to 0/1
            if isinstance(value, bool):
                value = 1 if value else 0
            features.append(float(value))

        return np.array([features])

    def predict(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict payment time and risk level

        Returns:
            {
                'predictedDaysUntilPayment': int,
                'paymentProbability': float,
                'confidenceScore': float,
                'recommendedStrategy': str,
                'riskLevel': str,
                'factors': List[Dict],
            }
        """
        features = self.extract_features(features_dict)

        # If models not trained, use rule-based fallback
        if not self.xgboost_model and not self.gb_model:
            return self._fallback_prediction(features_dict)

        # Scale features
        if self.scaler:
            features_scaled = self.scaler.transform(features)
        else:
            features_scaled = features

        # Ensemble prediction
        predictions = []
        if self.xgboost_model and HAS_ML:
            xgb_pred = self.xgboost_model.predict(features_scaled)[0]
            predictions.append(xgb_pred)

        if self.gb_model:
            gb_pred = self.gb_model.predict(features_scaled)[0]
            predictions.append(gb_pred)

        # Average ensemble predictions
        predicted_days = int(np.mean(predictions))

        # Calculate payment probability (inverse sigmoid of days)
        payment_probability = 1 / (1 + np.exp((predicted_days - 30) / 10))

        # Confidence score based on model agreement
        if len(predictions) > 1:
            confidence = 1 - (np.std(predictions) / max(predicted_days, 1))
        else:
            confidence = 0.7  # Default confidence for single model

        # Determine risk level and strategy
        risk_level, strategy = self._determine_risk_and_strategy(
            predicted_days,
            payment_probability,
            features_dict
        )

        # Feature importance
        factors = self._get_feature_importance(features_dict)

        return {
            'predictedDaysUntilPayment': max(0, predicted_days),
            'paymentProbability': float(payment_probability),
            'confidenceScore': float(confidence),
            'recommendedStrategy': strategy,
            'riskLevel': risk_level,
            'factors': factors,
        }

    def _fallback_prediction(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback when models not available"""
        days_overdue = features_dict.get('daysOverdue', 0)
        client_avg_payment = features_dict.get('clientAveragePaymentTime', 30)
        client_payment_rate = features_dict.get('clientPaymentRate', 0.8)

        # Rule-based prediction
        base_prediction = client_avg_payment
        if days_overdue > 30:
            base_prediction += 15
        if days_overdue > 60:
            base_prediction += 30

        # Adjust by payment rate
        predicted_days = int(base_prediction * (2 - client_payment_rate))
        payment_probability = client_payment_rate * (1 - min(days_overdue / 90, 0.5))

        risk_level, strategy = self._determine_risk_and_strategy(
            predicted_days,
            payment_probability,
            features_dict
        )

        return {
            'predictedDaysUntilPayment': max(0, predicted_days),
            'paymentProbability': float(payment_probability),
            'confidenceScore': 0.5,  # Lower confidence for rule-based
            'recommendedStrategy': strategy,
            'riskLevel': risk_level,
            'factors': [
                {'feature': 'daysOverdue', 'impact': 0.4, 'value': days_overdue},
                {'feature': 'clientAveragePaymentTime', 'impact': 0.3, 'value': client_avg_payment},
                {'feature': 'clientPaymentRate', 'impact': 0.3, 'value': client_payment_rate},
            ],
        }

    def _determine_risk_and_strategy(
        self,
        predicted_days: int,
        payment_probability: float,
        features_dict: Dict[str, Any]
    ) -> tuple:
        """Determine risk level and recommended strategy"""
        days_overdue = features_dict.get('daysOverdue', 0)

        # Risk level determination
        if payment_probability > 0.8 and predicted_days < 14:
            risk_level = 'low'
            strategy = 'gentle'
        elif payment_probability > 0.6 and predicted_days < 30:
            risk_level = 'medium'
            strategy = 'standard'
        elif payment_probability > 0.4 or days_overdue < 60:
            risk_level = 'high'
            strategy = 'firm'
        else:
            risk_level = 'critical'
            strategy = 'escalate'

        return risk_level, strategy

    def _get_feature_importance(self, features_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get top 5 most important features"""
        # If XGBoost model available, use its feature importance
        if self.xgboost_model and HAS_ML and hasattr(self.xgboost_model, 'feature_importances_'):
            importances = self.xgboost_model.feature_importances_
            top_indices = np.argsort(importances)[-5:][::-1]

            factors = []
            for idx in top_indices:
                feature_name = FEATURE_NAMES[idx]
                factors.append({
                    'feature': feature_name,
                    'impact': float(importances[idx]),
                    'value': features_dict.get(feature_name, 0),
                })
            return factors

        # Fallback: return most relevant features
        return [
            {'feature': 'daysOverdue', 'impact': 0.3, 'value': features_dict.get('daysOverdue', 0)},
            {'feature': 'clientAveragePaymentTime', 'impact': 0.25, 'value': features_dict.get('clientAveragePaymentTime', 0)},
            {'feature': 'clientPaymentRate', 'impact': 0.2, 'value': features_dict.get('clientPaymentRate', 0)},
            {'feature': 'invoiceAmount', 'impact': 0.15, 'value': features_dict.get('invoiceAmount', 0)},
            {'feature': 'emailOpenRate', 'impact': 0.1, 'value': features_dict.get('emailOpenRate', 0)},
        ]

    def record_outcome(self, features_dict: Dict[str, Any], actual_days: int, was_paid: bool):
        """Record actual payment outcome for retraining"""
        training_sample = {
            'features': features_dict,
            'actualDaysToPayment': actual_days,
            'wasPaid': was_paid,
            'timestamp': datetime.utcnow().isoformat(),
        }

        self.training_data.append(training_sample)

        # Save updated training data
        try:
            with open(TRAINING_DATA_PATH, 'w') as f:
                json.dump(self.training_data, f, indent=2)
            logging.info(f"Recorded payment outcome. Total samples: {len(self.training_data)}")
        except Exception as e:
            logging.error(f"Error saving training data: {e}")

    def train_models(self, min_samples: int = 100):
        """Train/retrain models on collected data"""
        if not HAS_ML:
            logging.error("ML libraries not available for training")
            return {'success': False, 'error': 'ML libraries not installed'}

        if len(self.training_data) < min_samples:
            return {
                'success': False,
                'error': f'Not enough training data. Need {min_samples}, have {len(self.training_data)}'
            }

        try:
            # Extract features and labels
            X = []
            y = []

            for sample in self.training_data:
                if sample['wasPaid']:  # Only train on paid invoices
                    features = self.extract_features(sample['features'])
                    X.append(features[0])
                    y.append(sample['actualDaysToPayment'])

            X = np.array(X)
            y = np.array(y)

            # Fit scaler
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X)

            # Train XGBoost
            self.xgboost_model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42
            )
            self.xgboost_model.fit(X_scaled, y)

            # Train Gradient Boosting
            self.gb_model = GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )
            self.gb_model.fit(X_scaled, y)

            # Update metadata
            self.metadata = {
                'trainedAt': datetime.utcnow().isoformat(),
                'sampleCount': len(X),
                'paidInvoices': len(y),
                'unpaidInvoices': len(self.training_data) - len(y),
                'features': FEATURE_NAMES,
            }

            # Save models
            self.save_models()

            logging.info(f"Models trained successfully on {len(X)} samples")
            return {'success': True, 'sampleCount': len(X)}

        except Exception as e:
            logging.error(f"Error training models: {e}")
            return {'success': False, 'error': str(e)}


# Global predictor instance
predictor = PaymentPredictor()


@app.route('/ml/predict-payment', methods=['POST'])
def predict_payment():
    """Predict payment time from features"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        prediction = predictor.predict(data)
        return jsonify(prediction), 200

    except Exception as e:
        logging.error(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/ml/record-outcome', methods=['POST'])
def record_outcome():
    """Record actual payment outcome for learning"""
    try:
        data = request.get_json()

        if not data or 'features' not in data:
            return jsonify({'error': 'Invalid data format'}), 400

        features = data['features']
        actual_days = data.get('actualDaysToPayment', 0)
        was_paid = data.get('wasPaid', False)

        predictor.record_outcome(features, actual_days, was_paid)

        return jsonify({'success': True, 'totalSamples': len(predictor.training_data)}), 200

    except Exception as e:
        logging.error(f"Record outcome error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/ml/train', methods=['POST'])
def train_models():
    """Trigger model retraining"""
    try:
        result = predictor.train_models()

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        logging.error(f"Training error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/ml/model-info', methods=['GET'])
def model_info():
    """Get model metadata"""
    return jsonify({
        'metadata': predictor.metadata,
        'trainingSamples': len(predictor.training_data),
        'modelsLoaded': {
            'scaler': predictor.scaler is not None,
            'xgboost': predictor.xgboost_model is not None,
            'gradientBoosting': predictor.gb_model is not None,
        },
        'hasMLLibraries': HAS_ML,
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ml-payment-predictor'}), 200


if __name__ == '__main__':
    # Generate synthetic training data on first run
    if len(predictor.training_data) == 0:
        logging.info("Generating synthetic training data...")
        from generate_training_data import generate_synthetic_data
        synthetic_data = generate_synthetic_data(500)
        predictor.training_data = synthetic_data
        predictor.save_models()
        logging.info(f"Generated {len(synthetic_data)} synthetic training samples")

        # Train initial models
        predictor.train_models(min_samples=50)

    app.run(host='0.0.0.0', port=5001, debug=False)
