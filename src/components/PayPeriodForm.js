import React, { useMemo, useState } from "react";
import "./PayPeriodForm.css";

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function PayPeriodForm({ onAddPayPeriod }) {
  const [periodStartDate, setPeriodStartDate] = useState("");
  const [paydayOffsetDays, setPaydayOffsetDays] = useState("14");
  const [expectedAmount, setExpectedAmount] = useState("");

  const computedPeriod = useMemo(() => {
    if (!periodStartDate || !paydayOffsetDays) {
      return null;
    }

    const [year, month, day] = periodStartDate.split("-").map(Number);
    const periodStart = new Date(year, month - 1, day);
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 13);

    const payday = new Date(periodEnd);
    payday.setDate(payday.getDate() + Number(paydayOffsetDays));

    return {
      workWeekStart: formatDate(periodStart),
      workWeekEnd: formatDate(periodEnd),
      expectedPayday: formatDate(payday),
      paydayOffsetDays: Number(paydayOffsetDays),
    };
  }, [paydayOffsetDays, periodStartDate]);

  const paydayOffsetOptions = useMemo(
    () => Array.from({ length: 30 }, (_, index) => index + 1),
    [],
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!computedPeriod || !expectedAmount) {
      alert("Please fill in all fields");
      return;
    }

    onAddPayPeriod({
      workWeekStart: computedPeriod.workWeekStart,
      workWeekEnd: computedPeriod.workWeekEnd,
      expectedPayday: computedPeriod.expectedPayday,
      paydayOffsetDays: computedPeriod.paydayOffsetDays,
      expectedAmount: parseFloat(expectedAmount),
      actualPayments: [],
    });

    // Reset form
    setPeriodStartDate("");
    setPaydayOffsetDays("14");
    setExpectedAmount("");
  };

  return (
    <div className="pay-period-form">
      <h2>Add New Pay Period</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="periodStartDate">Pay Period Start Date:</label>
          <input
            id="periodStartDate"
            type="date"
            value={periodStartDate}
            onChange={(e) => setPeriodStartDate(e.target.value)}
            required
          />
          {computedPeriod && (
            <small className="helper-text">
              Biweekly range: {formatDisplayDate(computedPeriod.workWeekStart)}{" "}
              - {formatDisplayDate(computedPeriod.workWeekEnd)}
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="paydayOffsetDays">
            Payday Offset After Period End:
          </label>
          <select
            id="paydayOffsetDays"
            value={paydayOffsetDays}
            onChange={(e) => setPaydayOffsetDays(e.target.value)}
            required
          >
            {paydayOffsetOptions.map((days) => (
              <option key={days} value={days}>
                {days} day{days === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          {computedPeriod && (
            <small className="helper-text">
              Expected payday:{" "}
              {formatDisplayDate(computedPeriod.expectedPayday)}
            </small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="expectedAmount">Expected Amount ($):</label>
          <input
            type="number"
            id="expectedAmount"
            step="0.01"
            min="0"
            value={expectedAmount}
            onChange={(e) => setExpectedAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <button type="submit" className="btn-primary">
          Add Pay Period
        </button>
      </form>
    </div>
  );
}

export default PayPeriodForm;
