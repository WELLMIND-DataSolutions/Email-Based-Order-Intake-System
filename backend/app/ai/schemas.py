from typing import List, Optional

from pydantic import BaseModel, Field


class OrderItem(BaseModel):
    description: str
    quantity: int = Field(default=1)  # default value if the model misses it
    unit_price: Optional[float] = None


class ExtractedOrder(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_items: List[OrderItem]
    total_amount: Optional[float] = None
    shipping_address: Optional[str] = None
