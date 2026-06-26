from datetime import date, datetime, time

from orders.models import Order


def get_date_range(preset: str | None, from_date: date | None, to_date: date | None):
    if preset and preset != 'all':
        end = date.today()
        start = date.today()
        if preset == 'daily':
            pass
        elif preset == 'weekly':
            start = date.fromordinal(end.toordinal() - 6)
        elif preset == 'monthly':
            start = date.fromordinal(end.toordinal() - 29)
        return start, end
    return from_date, to_date


def apply_filters(q, from_date, to_date):
    if from_date is not None:
        q = q.filter(Order.created_at >= datetime.combine(from_date, time.min))
    if to_date is not None:
        q = q.filter(Order.created_at <= datetime.combine(to_date, time.max))
    return q
