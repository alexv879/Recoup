# python-services/rate_limiter.py
import redis.asyncio as redis
import time
from datetime import datetime
import os
import json

class RateLimiter:
    def __init__(self, redis_url=os.environ.get("REDIS_URL", "redis://localhost:6379")):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.limits = {
          'starter': {
              'monthly': {'collections': 10, 'emails': 500, 'sms': 0, 'ai_calls': 0, 'letters': 0},
              'daily': {'emails': 50, 'total_cost_gbp': 5.00},
              'hourly': {'emails': 10, 'api_calls': 100}
          },
          'growth': {
              'monthly': {'collections': 50, 'emails': 2000, 'sms': 100, 'ai_calls': 10, 'letters': 10},
              'daily': {'emails': 200, 'sms': 20, 'ai_calls': 2, 'total_cost_gbp': 25.00},
              'hourly': {'emails': 30, 'sms': 5, 'ai_calls': 1, 'api_calls': 500}
          },
          'pro': {
              'monthly': {'collections': 200, 'emails': 5000, 'sms': 500, 'ai_calls': 50, 'letters': 50},
              'daily': {'emails': 500, 'sms': 50, 'ai_calls': 5, 'letters': 5, 'total_cost_gbp': 100.00},
              'hourly': {'emails': 50, 'sms': 10, 'ai_calls': 2, 'api_calls': 1000}
          }
        }
        self.costs = {
          'email': 0.002,
          'sms': 0.04,
          'ai_call': 2.50,
          'letter': 1.50
        }

    async def check_limit(self, user_id, action, count=1):
        # In a real app, you'd get the user's tier from the database
        user_tier = "pro" # Mocking for now
        limits = self.limits.get(user_tier, self.limits['starter'])

        # Check various time windows
        if not await self._is_allowed(user_id, action, count, "hourly", limits.get('hourly', {}).get(action)):
            return {'allowed': False, 'reason': f'Hourly limit for {action} exceeded'}
        if not await self._is_allowed(user_id, action, count, "daily", limits.get('daily', {}).get(action)):
            return {'allowed': False, 'reason': f'Daily limit for {action} exceeded'}
        if not await self._is_allowed(user_id, action, count, "monthly", limits.get('monthly', {}).get(action)):
            return {'allowed': False, 'reason': f'Monthly limit for {action} exceeded'}

        # Check cost limit
        cost = self.costs.get(action, 0) * count
        if cost > 0:
            daily_cost_limit = limits.get('daily', {}).get('total_cost_gbp')
            if not await self._is_cost_allowed(user_id, cost, daily_cost_limit):
                return {'allowed': False, 'reason': 'Daily cost limit exceeded'}

        return {'allowed': True}
    
    async def consume_limit(self, user_id, action, count=1):
        pipe = self.redis.pipeline()
        for window in ["hourly", "daily", "monthly"]:
            key = self._get_key(user_id, action, window)
            pipe.incrby(key, count)
            pipe.expire(key, self._get_ttl(window))
        
        cost = self.costs.get(action, 0) * count
        if cost > 0:
            cost_key = self._get_cost_key(user_id, "daily")
            pipe.incrbyfloat(cost_key, cost)
            pipe.expire(cost_key, self._get_ttl("daily"))

        await pipe.execute()
        return {'allowed': True}

    async def _is_allowed(self, user_id, action, count, window, limit):
        if limit is None:
            return True
        key = self._get_key(user_id, action, window)
        current_usage = await self.redis.get(key)
        current_usage = int(current_usage) if current_usage else 0
        return current_usage + count <= limit

    async def _is_cost_allowed(self, user_id, cost, limit):
        if limit is None:
            return True
        key = self._get_cost_key(user_id, "daily")
        current_cost = await self.redis.get(key)
        current_cost = float(current_cost) if current_cost else 0
        return current_cost + cost <= limit

    def _get_key(self, user_id, action, window):
        ts = self._get_timestamp_for_window(window)
        return f"ratelimit:{user_id}:{action}:{window}:{ts}"

    def _get_cost_key(self, user_id, window):
        ts = self._get_timestamp_for_window(window)
        return f"ratelimit:cost:{user_id}:{window}:{ts}"

    def _get_timestamp_for_window(self, window):
        now = datetime.utcnow()
        if window == "hourly":
            return now.strftime("%Y-%m-%d-%H")
        if window == "daily":
            return now.strftime("%Y-%m-%d")
        if window == "monthly":
            return now.strftime("%Y-%m")
        return ""
    
    def _get_ttl(self, window):
        if window == "hourly":
            return 3600
        if window == "daily":
            return 86400
        if window == "monthly":
            return 31 * 86400
        return 3600
