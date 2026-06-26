from orders.models import Order
from datetime import datetime, time


def apply_filters(q, from_date, to_date):
    if from_date is not None:
        q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
    if to_date is not None:
        q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
    return q
