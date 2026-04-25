import React, { useState, useEffect } from "react";
import "./App.css";
import PayPeriodForm from "./components/PayPeriodForm";
import PayPeriodList from "./components/PayPeriodList";
import { supabase } from "./supabaseClient";

// Convert a Supabase DB row to the shape the UI expects
const dbToLocal = (row) => ({
  id: row.id,
  workWeekStart: row.work_week_start,
  workWeekEnd: row.work_week_end,
  expectedPayday: row.expected_payday,
  expectedAmount: row.expected_amount,
  actualPayments: row.actual_payments || [],
});

function App() {
  const [payPeriods, setPayPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    // ── One-time migration from localStorage ──────────────────────────────
    const saved = localStorage.getItem("payPeriods");
    if (saved) {
      try {
        const localData = JSON.parse(saved);
        if (localData.length > 0) {
          // Only upload if the table is still empty to avoid duplicates
          const { data: existing, error: checkError } = await supabase
            .from("pay_periods")
            .select("id")
            .limit(1);
          if (checkError) throw checkError;
          if (!existing || existing.length === 0) {
            const rows = localData.map((p) => ({
              id: p.id,
              work_week_start: p.workWeekStart,
              work_week_end: p.workWeekEnd,
              expected_payday: p.expectedPayday,
              expected_amount: p.expectedAmount,
              actual_payments: p.actualPayments || [],
            }));
            const { error: upsertError } = await supabase
              .from("pay_periods")
              .upsert(rows);
            if (upsertError) throw upsertError;
          }
        }
        // Only clear localStorage after confirmed success
        localStorage.removeItem("payPeriods");
      } catch (e) {
        console.error("Migration error — localStorage kept as backup:", e);
      }
    }

    // ── Load from Supabase ────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("pay_periods")
      .select("*")
      .order("expected_payday", { ascending: false });

    if (error) {
      console.error("Error loading data:", error);
    } else {
      setPayPeriods((data || []).map(dbToLocal));
    }
    setLoading(false);
  };

  const addPayPeriod = async (payPeriod) => {
    const id = Date.now();
    const row = {
      id,
      work_week_start: payPeriod.workWeekStart,
      work_week_end: payPeriod.workWeekEnd,
      expected_payday: payPeriod.expectedPayday,
      expected_amount: payPeriod.expectedAmount,
      actual_payments: [],
    };
    const { error } = await supabase.from("pay_periods").insert(row);
    if (error) {
      console.error(error);
      return;
    }
    setPayPeriods((prev) => [
      { ...payPeriod, id, actualPayments: [] },
      ...prev,
    ]);
  };

  const deletePayPeriod = async (id) => {
    const { error } = await supabase.from("pay_periods").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
    }
    setPayPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const addActualPayment = async (periodId, payment) => {
    const period = payPeriods.find((p) => p.id === periodId);
    const newPayments = [...(period.actualPayments || []), payment];
    const { error } = await supabase
      .from("pay_periods")
      .update({ actual_payments: newPayments })
      .eq("id", periodId);
    if (error) {
      console.error(error);
      return;
    }
    setPayPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId ? { ...p, actualPayments: newPayments } : p,
      ),
    );
  };

  const deleteActualPayment = async (periodId, paymentIndex) => {
    const period = payPeriods.find((p) => p.id === periodId);
    const newPayments = [...period.actualPayments];
    newPayments.splice(paymentIndex, 1);
    const { error } = await supabase
      .from("pay_periods")
      .update({ actual_payments: newPayments })
      .eq("id", periodId);
    if (error) {
      console.error(error);
      return;
    }
    setPayPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId ? { ...p, actualPayments: newPayments } : p,
      ),
    );
  };

  if (loading) {
    return (
      <div className="App">
        <div className="container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <h1>💰 Paystub Tracker</h1>
        <p className="subtitle">
          Track your biweekly payments and manage delays
        </p>

        <PayPeriodForm onAddPayPeriod={addPayPeriod} />
        <PayPeriodList
          payPeriods={payPeriods}
          onDeletePayPeriod={deletePayPeriod}
          onAddActualPayment={addActualPayment}
          onDeleteActualPayment={deleteActualPayment}
        />
      </div>
    </div>
  );
}

export default App;
