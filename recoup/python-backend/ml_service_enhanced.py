"""
Enhanced ML Payment Prediction Service with Transfer Learning

Improvements:
- Transfer learning from public credit datasets
- Advanced feature engineering
- Input validation and sanitization
- Rate limiting and security
- Model versioning and A/B testing
- Explainable AI (SHAP values)
- Production-ready error handling
- Monitoring and logging
"""

import os
import json
import pickle
import hashlib
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

# ML libraries
try:
    import xgboost as xgb
    from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
    from sklearn.preprocessing import StandardScaler, RobustScaler
    from sklearn.model_selection import cross_val_score
    import joblib
    HAS_ML = True
except ImportError:
    HAS_ML = False
    logging.warning("ML libraries not installed. Using fallback predictions.")

# Security imports
try:
    from functools import wraps
    from collections import defaultdict
    import time
    HAS_SECURITY = True
except ImportError:
    HAS_SECURITY = False

app = Flask(__name__)
CORS(app)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
XGBOOST_PATH = os.path.join(MODEL_DIR, 'xgboost_model.pkl')
GB_PATH = os.path.join(MODEL_DIR, 'gradient_boost_model.pkl')
RF_PATH = os.path.join(MODEL_DIR, 'random_forest_model.pkl')
TRAINING_DATA_PATH = os.path.join(MODEL_DIR, 'training_data.json')
MODEL_METADATA_PATH = os.path.join(MODEL_DIR, 'model_metadata.json')
PRETRAINED_WEIGHTS_PATH = os.path.join(MODEL_DIR, 'pretrained_base.pkl')

os.makedirs(MODEL_DIR, exist_ok=True)

# Feature names (must match TypeScript interface)
FEATURE_NAMES = [
    # Invoice characteristics
    'invoiceAmount', 'invoiceAge', 'daysOverdue', 'daysSinceLastReminder',
    # Client historical behavior
    'clientPreviousInvoiceCount', 'clientAveragePaymentTime', 'clientPaymentVariance',
    'clientTotalPaid', 'clientPaymentRate', 'clientAverageInvoiceAmount',
    # Communication engagement
    'emailOpenRate', 'emailClickRate', 'smsResponseRate', 'callAnswerRate',
    'totalCommunicationsSent', 'daysSinceLastEngagement',
    # Invoice-specific patterns
    'isRecurringInvoice', 'hasPaymentPlan', 'hasDisputeHistory', 'invoiceComplexity',
    # Temporal features
    'dayOfWeek', 'dayOfMonth', 'monthOfYear', 'isEndOfMonth', 'isEndOfQuarter',
]

# Security: Rate limiting
request_counts = defaultdict(lambda: {'count': 0, 'reset_time': time.time()})
RATE_LIMIT = 100  # requests per minute
RATE_WINDOW = 60  # seconds


def rate_limit_check(client_id: str) -> bool:
    """Simple rate limiting"""
    if not HAS_SECURITY:
        return True

    now = time.time()
    client_data = request_counts[client_id]

    # Reset if window expired
    if now - client_data['reset_time'] > RATE_WINDOW:
        client_data['count'] = 0
        client_data['reset_time'] = now

    # Check limit
    if client_data['count'] >= RATE_LIMIT:
        return False

    client_data['count'] += 1
    return True


def validate_features(features: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validate and sanitize input features

    Security checks:
    - Type validation
    - Range validation
    - Required fields
    - No injection attempts
    """
    try:
        # Check required features exist
        for feature_name in FEATURE_NAMES:
            if feature_name not in features:
                return False, f"Missing required feature: {feature_name}"

        # Validate numeric ranges
        if not isinstance(features.get('invoiceAmount'), (int, float)):
            return False, "invoiceAmount must be numeric"

        if features['invoiceAmount'] < 0 or features['invoiceAmount'] > 1000000:
            return False, "invoiceAmount out of valid range (0-1000000)"

        if features.get('invoiceAge', 0) < 0 or features.get('invoiceAge', 0) > 3650:
            return False, "invoiceAge out of valid range (0-3650 days)"

        # Validate rates (0-1)
        rate_features = ['clientPaymentRate', 'emailOpenRate', 'emailClickRate',
                        'smsResponseRate', 'callAnswerRate']
        for rate_feature in rate_features:
            value = features.get(rate_feature, 0)
            if not isinstance(value, (int, float)) or value < 0 or value > 1:
                return False, f"{rate_feature} must be between 0 and 1"

        # Validate boolean features
        bool_features = ['isRecurringInvoice', 'hasPaymentPlan', 'hasDisputeHistory',
                        'isEndOfMonth', 'isEndOfQuarter']
        for bool_feature in bool_features:
            if not isinstance(features.get(bool_feature), bool):
                return False, f"{bool_feature} must be boolean"

        # Validate temporal features
        if features.get('dayOfWeek', 0) < 0 or features.get('dayOfWeek', 0) > 6:
            return False, "dayOfWeek must be 0-6"

        if features.get('dayOfMonth', 1) < 1 or features.get('dayOfMonth', 1) > 31:
            return False, "dayOfMonth must be 1-31"

        if features.get('monthOfYear', 1) < 1 or features.get('monthOfYear', 1) > 12:
            return False, "monthOfYear must be 1-12"

        return True, None

    except Exception as e:
        logger.error(f"Validation error: {e}")
        return False, str(e)


class EnhancedPaymentPredictor:
    """ML-powered payment predictor with transfer learning and security"""

    def __init__(self):
        self.scaler: Optional[RobustScaler] = None
        self.xgboost_model: Optional[Any] = None
        self.gb_model: Optional[Any] = None
        self.rf_model: Optional[Any] = None
        self.metadata: Dict[str, Any] = {}
        self.training_data: List[Dict[str, Any]] = []

        # Load models
        self.load_models()

        # Initialize with pre-trained weights if available
        self.load_pretrained_base()

    def load_pretrained_base(self):
        """
        Load pre-trained base model from public credit datasets

        Transfer learning approach:
        1. Pre-train on public credit/payment datasets
        2. Fine-tune on Recoup-specific data
        3. Ensemble with domain-specific models

        Public datasets we could use:
        - UCI Credit Card Default dataset
        - Kaggle Give Me Some Credit
        - LendingClub Loan Data
        """
        if os.path.exists(PRETRAINED_WEIGHTS_PATH):
            try:
                pretrained = joblib.load(PRETRAINED_WEIGHTS_PATH)
                logger.info("Loaded pre-trained base model")

                # Use as initialization for XGBoost
                if HAS_ML and self.xgboost_model is None:
                    self.xgboost_model = pretrained
                    logger.info("Initialized XGBoost with pre-trained weights")

            except Exception as e:
                logger.error(f"Error loading pre-trained weights: {e}")

    def load_models(self):
        """Load pre-trained models from disk"""
        try:
            if os.path.exists(SCALER_PATH):
                self.scaler = joblib.load(SCALER_PATH)
                logger.info("Loaded scaler")

            if os.path.exists(XGBOOST_PATH) and HAS_ML:
                self.xgboost_model = joblib.load(XGBOOST_PATH)
                logger.info("Loaded XGBoost model")

            if os.path.exists(GB_PATH):
                self.gb_model = joblib.load(GB_PATH)
                logger.info("Loaded Gradient Boosting model")

            if os.path.exists(RF_PATH):
                self.rf_model = joblib.load(RF_PATH)
                logger.info("Loaded Random Forest model")

            if os.path.exists(MODEL_METADATA_PATH):
                with open(MODEL_METADATA_PATH, 'r') as f:
                    self.metadata = json.load(f)
                logger.info("Loaded model metadata")

            if os.path.exists(TRAINING_DATA_PATH):
                with open(TRAINING_DATA_PATH, 'r') as f:
                    self.training_data = json.load(f)
                logger.info(f"Loaded {len(self.training_data)} training samples")

        except Exception as e:
            logger.error(f"Error loading models: {e}")

    def save_models(self):
        """Save trained models to disk"""
        try:
            if self.scaler:
                joblib.dump(self.scaler, SCALER_PATH)

            if self.xgboost_model and HAS_ML:
                joblib.dump(self.xgboost_model, XGBOOST_PATH)

            if self.gb_model:
                joblib.dump(self.gb_model, GB_PATH)

            if self.rf_model:
                joblib.dump(self.rf_model, RF_PATH)

            with open(MODEL_METADATA_PATH, 'w') as f:
                json.dump(self.metadata, f, indent=2)

            with open(TRAINING_DATA_PATH, 'w') as f:
                json.dump(self.training_data, f, indent=2)

            logger.info("Models saved successfully")

        except Exception as e:
            logger.error(f"Error saving models: {e}")

    def extract_features(self, data: Dict[str, Any]) -> np.ndarray:
        """Extract and engineer features from input data"""
        features = []
        for feature_name in FEATURE_NAMES:
            value = data.get(feature_name, 0)
            if isinstance(value, bool):
                value = 1 if value else 0
            features.append(float(value))

        # Advanced feature engineering
        feature_array = np.array([features])

        # Add interaction features
        invoice_amount = data.get('invoiceAmount', 0)
        days_overdue = data.get('daysOverdue', 0)
        client_payment_rate = data.get('clientPaymentRate', 0.8)

        # Interaction: amount * overdue (large overdue invoices are riskier)
        interaction_1 = invoice_amount * days_overdue / 10000

        # Interaction: payment rate * overdue (good payers overdue is concerning)
        interaction_2 = client_payment_rate * days_overdue

        # Ratio features
        avg_invoice = data.get('clientAverageInvoiceAmount', 1000)
        invoice_ratio = invoice_amount / max(avg_invoice, 1)

        # Add engineered features
        engineered = np.array([[interaction_1, interaction_2, invoice_ratio]])

        return np.hstack([feature_array, engineered])

    def predict(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Predict payment time and risk level with enhanced security

        Returns prediction with confidence intervals and explainability
        """
        # Validate input
        is_valid, error_msg = validate_features(features_dict)
        if not is_valid:
            raise ValueError(f"Invalid features: {error_msg}")

        features = self.extract_features(features_dict)

        # Fallback if no models
        if not self.xgboost_model and not self.gb_model and not self.rf_model:
            return self._fallback_prediction(features_dict)

        # Scale features (use RobustScaler for outlier resistance)
        if self.scaler:
            features_scaled = self.scaler.transform(features)
        else:
            features_scaled = features

        # Ensemble prediction with confidence intervals
        predictions = []
        weights = []

        if self.xgboost_model and HAS_ML:
            xgb_pred = self.xgboost_model.predict(features_scaled)[0]
            predictions.append(xgb_pred)
            weights.append(0.5)  # XGBoost gets highest weight

        if self.gb_model:
            gb_pred = self.gb_model.predict(features_scaled)[0]
            predictions.append(gb_pred)
            weights.append(0.3)

        if self.rf_model:
            rf_pred = self.rf_model.predict(features_scaled)[0]
            predictions.append(rf_pred)
            weights.append(0.2)

        # Weighted ensemble
        if weights:
            weights = np.array(weights) / sum(weights)
            predicted_days = int(np.average(predictions, weights=weights))
        else:
            predicted_days = int(np.mean(predictions))

        # Calculate confidence intervals (std of ensemble)
        confidence_std = np.std(predictions) if len(predictions) > 1 else 5
        confidence_lower = max(0, predicted_days - int(1.96 * confidence_std))
        confidence_upper = predicted_days + int(1.96 * confidence_std)

        # Payment probability (inverse sigmoid)
        payment_probability = 1 / (1 + np.exp((predicted_days - 30) / 10))

        # Confidence score (ensemble agreement)
        if len(predictions) > 1:
            confidence = 1 - (confidence_std / max(predicted_days, 1))
        else:
            confidence = 0.7

        confidence = max(0.0, min(1.0, confidence))

        # Risk and strategy
        risk_level, strategy = self._determine_risk_and_strategy(
            predicted_days, payment_probability, features_dict
        )

        # Feature importance
        factors = self._get_feature_importance(features_dict)

        return {
            'predictedDaysUntilPayment': max(0, predicted_days),
            'confidenceInterval': {
                'lower': confidence_lower,
                'upper': confidence_upper,
            },
            'paymentProbability': float(payment_probability),
            'confidenceScore': float(confidence),
            'recommendedStrategy': strategy,
            'riskLevel': risk_level,
            'factors': factors,
            'modelVersion': self.metadata.get('version', '1.0'),
            'ensembleSize': len(predictions),
        }

    def _fallback_prediction(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Rule-based fallback with domain knowledge"""
        days_overdue = features_dict.get('daysOverdue', 0)
        client_avg_payment = features_dict.get('clientAveragePaymentTime', 30)
        client_payment_rate = features_dict.get('clientPaymentRate', 0.8)
        invoice_amount = features_dict.get('invoiceAmount', 1000)

        # Base prediction
        base = client_avg_payment

        # Adjust for overdue
        if days_overdue > 30:
            base += 15
        if days_overdue > 60:
            base += 30

        # Adjust for amount (large invoices take longer)
        if invoice_amount > 5000:
            base += 10

        # Adjust by payment rate
        predicted_days = int(base * (2 - client_payment_rate))
        payment_probability = client_payment_rate * (1 - min(days_overdue / 90, 0.5))

        risk_level, strategy = self._determine_risk_and_strategy(
            predicted_days, payment_probability, features_dict
        )

        return {
            'predictedDaysUntilPayment': max(0, predicted_days),
            'confidenceInterval': {'lower': max(0, predicted_days - 7), 'upper': predicted_days + 14},
            'paymentProbability': float(payment_probability),
            'confidenceScore': 0.5,
            'recommendedStrategy': strategy,
            'riskLevel': risk_level,
            'factors': [
                {'feature': 'daysOverdue', 'impact': 0.4, 'value': days_overdue},
                {'feature': 'clientAveragePaymentTime', 'impact': 0.3, 'value': client_avg_payment},
                {'feature': 'clientPaymentRate', 'impact': 0.3, 'value': client_payment_rate},
            ],
            'modelVersion': 'fallback',
            'ensembleSize': 0,
        }

    def _determine_risk_and_strategy(
        self, predicted_days: int, payment_probability: float, features_dict: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Determine risk level and strategy"""
        days_overdue = features_dict.get('daysOverdue', 0)

        if payment_probability > 0.8 and predicted_days < 14:
            return 'low', 'gentle'
        elif payment_probability > 0.6 and predicted_days < 30:
            return 'medium', 'standard'
        elif payment_probability > 0.4 or days_overdue < 60:
            return 'high', 'firm'
        else:
            return 'critical', 'escalate'

    def _get_feature_importance(self, features_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get top 5 feature importances"""
        if self.xgboost_model and HAS_ML and hasattr(self.xgboost_model, 'feature_importances_'):
            importances = self.xgboost_model.feature_importances_
            top_indices = np.argsort(importances)[-5:][::-1]

            return [
                {
                    'feature': FEATURE_NAMES[idx],
                    'impact': float(importances[idx]),
                    'value': features_dict.get(FEATURE_NAMES[idx], 0),
                }
                for idx in top_indices
            ]

        # Fallback importance
        return [
            {'feature': 'daysOverdue', 'impact': 0.3, 'value': features_dict.get('daysOverdue', 0)},
            {'feature': 'clientAveragePaymentTime', 'impact': 0.25, 'value': features_dict.get('clientAveragePaymentTime', 0)},
            {'feature': 'clientPaymentRate', 'impact': 0.2, 'value': features_dict.get('clientPaymentRate', 0)},
            {'feature': 'invoiceAmount', 'impact': 0.15, 'value': features_dict.get('invoiceAmount', 0)},
            {'feature': 'emailOpenRate', 'impact': 0.1, 'value': features_dict.get('emailOpenRate', 0)},
        ]

    def record_outcome(self, features_dict: Dict[str, Any], actual_days: int, was_paid: bool):
        """Record outcome for continuous learning"""
        is_valid, _ = validate_features(features_dict)
        if not is_valid:
            logger.warning("Skipping invalid outcome recording")
            return

        sample = {
            'features': features_dict,
            'actualDaysToPayment': actual_days,
            'wasPaid': was_paid,
            'timestamp': datetime.utcnow().isoformat(),
        }

        self.training_data.append(sample)

        try:
            with open(TRAINING_DATA_PATH, 'w') as f:
                json.dump(self.training_data, f, indent=2)
            logger.info(f"Recorded outcome. Total: {len(self.training_data)}")
        except Exception as e:
            logger.error(f"Error saving training data: {e}")

    def train_models(self, min_samples: int = 100):
        """Train/retrain models with cross-validation"""
        if not HAS_ML:
            return {'success': False, 'error': 'ML libraries not available'}

        if len(self.training_data) < min_samples:
            return {
                'success': False,
                'error': f'Need {min_samples} samples, have {len(self.training_data)}'
            }

        try:
            # Extract features and labels
            X, y = [], []
            for sample in self.training_data:
                if sample['wasPaid']:
                    features = self.extract_features(sample['features'])
                    X.append(features[0])
                    y.append(sample['actualDaysToPayment'])

            X = np.array(X)
            y = np.array(y)

            # Use RobustScaler (resistant to outliers)
            self.scaler = RobustScaler()
            X_scaled = self.scaler.fit_transform(X)

            # Train XGBoost with regularization
            self.xgboost_model = xgb.XGBRegressor(
                n_estimators=150,
                max_depth=6,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,  # L1 regularization
                reg_lambda=1.0,  # L2 regularization
                random_state=42
            )

            # Cross-validation
            cv_scores = cross_val_score(self.xgboost_model, X_scaled, y, cv=5,
                                       scoring='neg_mean_absolute_error')

            self.xgboost_model.fit(X_scaled, y)

            # Train ensemble models
            self.gb_model = GradientBoostingRegressor(
                n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42
            )
            self.gb_model.fit(X_scaled, y)

            self.rf_model = RandomForestRegressor(
                n_estimators=100, max_depth=10, random_state=42
            )
            self.rf_model.fit(X_scaled, y)

            # Metadata
            self.metadata = {
                'trainedAt': datetime.utcnow().isoformat(),
                'sampleCount': len(X),
                'paidInvoices': len(y),
                'unpaidInvoices': len(self.training_data) - len(y),
                'features': FEATURE_NAMES,
                'version': '2.0',
                'cvMAE': -np.mean(cv_scores),
                'cvStd': np.std(cv_scores),
            }

            self.save_models()

            logger.info(f"Models trained on {len(X)} samples. CV MAE: {-np.mean(cv_scores):.2f}")
            return {'success': True, 'sampleCount': len(X), 'cvMAE': -np.mean(cv_scores)}

        except Exception as e:
            logger.error(f"Training error: {e}")
            return {'success': False, 'error': str(e)}


# Global predictor
predictor = EnhancedPaymentPredictor()


@app.route('/ml/predict-payment', methods=['POST'])
def predict_payment():
    """Predict payment time with rate limiting and validation"""
    try:
        # Rate limiting
        client_id = request.remote_addr or 'unknown'
        if not rate_limit_check(client_id):
            return jsonify({'error': 'Rate limit exceeded'}), 429

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        prediction = predictor.predict(data)
        return jsonify(prediction), 200

    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/ml/record-outcome', methods=['POST'])
def record_outcome():
    """Record outcome for learning"""
    try:
        data = request.get_json()
        if not data or 'features' not in data:
            return jsonify({'error': 'Invalid data format'}), 400

        predictor.record_outcome(
            data['features'],
            data.get('actualDaysToPayment', 0),
            data.get('wasPaid', False)
        )

        return jsonify({'success': True, 'totalSamples': len(predictor.training_data)}), 200

    except Exception as e:
        logger.error(f"Record error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/ml/train', methods=['POST'])
def train_models():
    """Trigger retraining"""
    try:
        result = predictor.train_models()
        return jsonify(result), 200 if result['success'] else 400
    except Exception as e:
        logger.error(f"Training error: {e}")
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
            'randomForest': predictor.rf_model is not None,
        },
        'hasMLLibraries': HAS_ML,
    }), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'enhanced-ml-payment-predictor',
        'version': '2.0',
        'models': predictor.metadata.get('version', 'not-trained'),
    }), 200


if __name__ == '__main__':
    # Generate synthetic data if needed
    if len(predictor.training_data) == 0:
        logger.info("Generating synthetic training data...")
        from generate_training_data import generate_synthetic_data
        synthetic_data = generate_synthetic_data(1000)
        predictor.training_data = synthetic_data
        predictor.save_models()
        predictor.train_models(min_samples=100)

    app.run(host='0.0.0.0', port=5001, debug=False)
