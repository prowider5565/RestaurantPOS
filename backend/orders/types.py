from enum import Enum


class OrderStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    
