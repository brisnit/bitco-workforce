"use client";

import { useParams } from "next/navigation";
import { WorkOrderDetail } from "@/components/work-orders/work-order-detail";

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <WorkOrderDetail id={id} />;
}
