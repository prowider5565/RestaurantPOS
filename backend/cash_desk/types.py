from enum import Enum


class TransactionType(str, Enum):
    IN = "in"
    OUT = "out"
