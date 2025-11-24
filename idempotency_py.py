# python-services/idempotency.py
import redis.asyncio as redis
import hashlib
import json
from datetime import datetime
import os

class IdempotencyHandler:
    def __init__(self, redis_url=os.environ.get("REDIS_URL", "redis://localhost:6379")):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = 86400 * 2 # Default 2 days for webhooks

    def _generate_key(self, provider, event_id):
        return f"idempotency:{provider}:{event_id}"

    async def handle_webhook(self, provider, event_id, handler):
        key = self._generate_key(provider, event_id)
        
        # Check if the key exists
        existing = await self.redis.get(key)
        if existing:
            response_data = json.loads(existing)
            if response_data.get('status') == 'completed':
                # Already processed, return cached result
                return response_data.get('result')
            else:
                # Still processing or failed, prevent new execution
                raise ValueError("Webhook is already being processed or has failed.")

        # Key does not exist, start processing
        try:
            # Set a processing lock
            await self.redis.set(key, json.dumps({'status': 'processing', 'timestamp': datetime.utcnow().isoformat()}), ex=self.ttl)
            
            # Execute the actual webhook logic
            result = await handler()
            
            # Store the successful result and mark as completed
            response_to_cache = {'status': 'completed', 'result': result}
            await self.redis.set(key, json.dumps(response_to_cache), ex=self.ttl)
            
            return result
        except Exception as e:
            # If the handler fails, store the failure state
            failure_response = {'status': 'failed', 'error': str(e)}
            await self.redis.set(key, json.dumps(failure_response), ex=3600) # Keep failure record for 1 hour
            raise e

