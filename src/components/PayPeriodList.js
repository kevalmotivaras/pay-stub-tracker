import React from "react";
import "./PayPeriodList.css";
import PayPeriodCard from "./PayPeriodCard";

function PayPeriodList({
  payPeriods,
  onDeletePayPeriod,
  onAddActualPayment,
  onDeleteActualPayment,
}) {
  if (payPeriods.length === 0) {
    return (
      <div className="empty-state">
        <p>📋 No pay periods tracked yet. Add your first one above!</p>
      </div>
    );
  }

  // Sort pay periods by expected payday (most recent first)
  const sortedPeriods = [...payPeriods].sort((a, b) => {
    return new Date(b.expectedPayday) - new Date(a.expectedPayday);
  });

  return (
    <div className="pay-period-list">
      <h2>Your Pay Periods</h2>
      <div className="period-cards">
        {sortedPeriods.map((period) => (
          <PayPeriodCard
            key={period.id}
            period={period}
            onDelete={() => onDeletePayPeriod(period.id)}
            onAddActualPayment={onAddActualPayment}
            onDeleteActualPayment={onDeleteActualPayment}
          />
        ))}
      </div>
    </div>
  );
}

export default PayPeriodList;
