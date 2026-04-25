import React, { useState } from "react";
import "./PayPeriodCard.css";

function PayPeriodCard({
  period,
  onDelete,
  onAddActualPayment,
  onDeleteActualPayment,
}) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [actualDate, setActualDate] = useState("");
  const [actualAmount, setActualAmount] = useState("");

  const formatDate = (dateString) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculateTotalReceived = () => {
    if (!period.actualPayments || period.actualPayments.length === 0) return 0;
    return period.actualPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
  };

  const calculateDelay = (expectedDate, actualDate) => {
    const expected = new Date(expectedDate);
    const actual = new Date(actualDate);
    const diffTime = actual - expected;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatus = () => {
    const totalReceived = calculateTotalReceived();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedDate = new Date(period.expectedPayday);
    expectedDate.setHours(0, 0, 0, 0);

    if (totalReceived >= period.expectedAmount) {
      return {
        status: "complete",
        label: "✓ Complete",
        class: "status-complete",
      };
    } else if (totalReceived > 0) {
      return {
        status: "partial",
        label: "⏳ Partial",
        class: "status-partial",
      };
    } else if (today > expectedDate) {
      return {
        status: "delayed",
        label: "⚠️ Delayed",
        class: "status-delayed",
      };
    } else {
      return {
        status: "pending",
        label: "⏰ Pending",
        class: "status-pending",
      };
    }
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!actualDate || !actualAmount) {
      alert("Please fill in both date and amount");
      return;
    }

    onAddActualPayment(period.id, {
      date: actualDate,
      amount: parseFloat(actualAmount),
    });

    setActualDate("");
    setActualAmount("");
    setShowAddPayment(false);
  };

  const status = getStatus();
  const totalReceived = calculateTotalReceived();
  const remaining = period.expectedAmount - totalReceived;

  return (
    <div className={`pay-period-card ${status.class}`}>
      <div className="card-header">
        <div className="card-title">
          <h3>Work Period</h3>
          <span className={`status-badge ${status.class}`}>{status.label}</span>
        </div>
        <button className="btn-delete" onClick={onDelete} title="Delete period">
          🗑️
        </button>
      </div>

      <div className="card-content">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">📅 Work Week:</span>
            <span className="info-value">
              {formatDate(period.workWeekStart)} →{" "}
              {formatDate(period.workWeekEnd)}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">💵 Expected Payday:</span>
            <span className="info-value">
              {formatDate(period.expectedPayday)}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">💰 Expected Amount:</span>
            <span className="info-value highlight">
              {formatCurrency(period.expectedAmount)}
            </span>
          </div>
        </div>

        {period.actualPayments && period.actualPayments.length > 0 && (
          <div className="actual-payments">
            <h4>Actual Payments Received:</h4>
            <div className="payments-list">
              {period.actualPayments.map((payment, index) => {
                const delay = calculateDelay(
                  period.expectedPayday,
                  payment.date,
                );
                return (
                  <div key={index} className="payment-item">
                    <div className="payment-info">
                      <span className="payment-date">
                        {formatDate(payment.date)}
                      </span>
                      <span className="payment-amount">
                        {formatCurrency(payment.amount)}
                      </span>
                      {delay > 0 && (
                        <span className="delay-badge">
                          +{delay} day{delay > 1 ? "s" : ""}
                        </span>
                      )}
                      {delay === 0 && (
                        <span className="ontime-badge">On time!</span>
                      )}
                    </div>
                    <button
                      className="btn-delete-payment"
                      onClick={() => onDeleteActualPayment(period.id, index)}
                      title="Remove payment"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="summary">
              <div className="summary-item">
                <span>Total Received:</span>
                <span className="summary-value">
                  {formatCurrency(totalReceived)}
                </span>
              </div>
              {remaining > 0 && (
                <div className="summary-item remaining">
                  <span>Remaining:</span>
                  <span className="summary-value">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              )}
              {remaining < 0 && (
                <div className="summary-item overpaid">
                  <span>Overpaid:</span>
                  <span className="summary-value">
                    {formatCurrency(Math.abs(remaining))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="actions">
          {!showAddPayment ? (
            <button
              className="btn-add-payment"
              onClick={() => setShowAddPayment(true)}
            >
              + Add Actual Payment
            </button>
          ) : (
            <form className="add-payment-form" onSubmit={handleAddPayment}>
              <div className="form-row">
                <input
                  type="date"
                  value={actualDate}
                  onChange={(e) => setActualDate(e.target.value)}
                  placeholder="Date received"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  placeholder="Amount"
                  required
                />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-save">
                  Save
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddPayment(false);
                    setActualDate("");
                    setActualAmount("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default PayPeriodCard;
