import React, { useState, useMemo } from "react";
import "./PayPeriodForm.css";

function PayPeriodForm({ onAddPayPeriod }) {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [expectedAmount, setExpectedAmount] = useState("");

  // Generate pay periods starting from Oct 22, 2025
  const payPeriods = useMemo(() => {
    const periods = [];
    // Use local date to avoid timezone issues
    const firstPeriodStart = new Date(2025, 9, 22); // Wednesday, Oct 22, 2025 (month is 0-indexed)

    // Generate periods for 2 years (52 pay periods)
    for (let i = 0; i < 52; i++) {
      const periodStart = new Date(firstPeriodStart);
      periodStart.setDate(periodStart.getDate() + i * 14); // Add 2 weeks for each period

      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 13); // 13 days later (2-week period)

      // Payday is 2 weeks after the work period ends (14 days after period end)
      const payday = new Date(periodEnd);
      payday.setDate(payday.getDate() + 15);

      // Format dates as YYYY-MM-DD in local time
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      periods.push({
        id: i,
        workWeekStart: formatDate(periodStart),
        workWeekEnd: formatDate(periodEnd),
        expectedPayday: formatDate(payday),
        label: `${periodStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })} - ${periodEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`,
      });
    }

    return periods;
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPeriod || !expectedAmount) {
      alert("Please fill in all fields");
      return;
    }

    const period = payPeriods.find((p) => p.id === parseInt(selectedPeriod));

    onAddPayPeriod({
      workWeekStart: period.workWeekStart,
      workWeekEnd: period.workWeekEnd,
      expectedPayday: period.expectedPayday,
      expectedAmount: parseFloat(expectedAmount),
      actualPayments: [],
    });

    // Reset form
    setSelectedPeriod("");
    setExpectedAmount("");
  };

  const selectedPeriodData = payPeriods.find(
    (p) => p.id === parseInt(selectedPeriod),
  );

  return (
    <div className="pay-period-form">
      <h2>Add New Pay Period</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="payPeriod">
            Select Pay Period (Wednesday - Tuesday):
          </label>
          <select
            id="payPeriod"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            required
          >
            <option value="">-- Select a pay period --</option>
            {payPeriods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
          {selectedPeriodData && (
            <small className="helper-text">
              Expected Payday:{" "}
              {new Date(selectedPeriodData.expectedPayday).toLocaleDateString(
                "en-US",
                {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                },
              )}
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
