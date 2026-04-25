import React, { useState, useEffect } from "react";
import "./App.css";
import PayPeriodForm from "./components/PayPeriodForm";
import PayPeriodList from "./components/PayPeriodList";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

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
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [initializingAuth, setInitializingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setInitializingAuth(false);
      setLoading(false);
      return;
    }

    const bootstrapAuth = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setInitializingAuth(false);
    };

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setAuthError("");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || initializingAuth) {
      return;
    }

    if (!session?.user?.id) {
      setPayPeriods([]);
      setLoading(false);
      return;
    }

    loadData(session.user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, initializingAuth]);

  const loadData = async (userId) => {
    if (!supabase) return;

    setLoading(true);
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
            .eq("user_id", userId)
            .limit(1);
          if (checkError) throw checkError;
          if (!existing || existing.length === 0) {
            const rows = localData.map((p) => ({
              id: p.id || Date.now() + Math.floor(Math.random() * 10000),
              user_id: userId,
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
        .eq("user_id", userId)
      .order("expected_payday", { ascending: false });

    if (error) {
      console.error("Error loading data:", error);
    } else {
      setPayPeriods((data || []).map(dbToLocal));
    }
    setLoading(false);
  };

  const addPayPeriod = async (payPeriod) => {
    if (!supabase || !session?.user?.id) return;

    const id = Date.now() + Math.floor(Math.random() * 10000);
    const row = {
      id,
      user_id: session.user.id,
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
    if (!supabase || !session?.user?.id) return;

    const { error } = await supabase
      .from("pay_periods")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);
    if (error) {
      console.error(error);
      return;
    }
    setPayPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const addActualPayment = async (periodId, payment) => {
    if (!supabase || !session?.user?.id) return;

    const period = payPeriods.find((p) => p.id === periodId);
    const newPayments = [...(period.actualPayments || []), payment];
    const { error } = await supabase
      .from("pay_periods")
      .update({ actual_payments: newPayments })
      .eq("id", periodId)
      .eq("user_id", session.user.id);
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
    if (!supabase || !session?.user?.id) return;

    const period = payPeriods.find((p) => p.id === periodId);
    const newPayments = [...period.actualPayments];
    newPayments.splice(paymentIndex, 1);
    const { error } = await supabase
      .from("pay_periods")
      .update({ actual_payments: newPayments })
      .eq("id", periodId)
      .eq("user_id", session.user.id);
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

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    if (!supabase) return;

    setAuthError("");
    setAuthMessage("");
    setAuthBusy(true);

    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setAuthMessage(
          "Account created. Check your email to confirm, then sign in.",
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message || "Authentication failed");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="App">
        <div className="container auth-container">
          <h1>Paystub Tracker</h1>
          <p className="subtitle">Configuration required</p>
          <p className="auth-helper">
            Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to run
            this app.
          </p>
        </div>
      </div>
    );
  }

  if (initializingAuth) {
    return (
      <div className="App">
        <div className="container">
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="App">
        <div className="container auth-container">
          <h1>💰 Paystub Tracker</h1>
          <p className="subtitle">Sign in to access your private data</p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label htmlFor="authEmail">Email</label>
            <input
              id="authEmail"
              type="email"
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
              required
              autoComplete="email"
            />

            <label htmlFor="authPassword">Password</label>
            <input
              id="authPassword"
              type="password"
              value={authPassword}
              onChange={(event) => setAuthPassword(event.target.value)}
              required
              minLength={8}
              autoComplete={
                authMode === "signup" ? "new-password" : "current-password"
              }
            />

            {authError && <p className="auth-error">{authError}</p>}
            {authMessage && <p className="auth-message">{authMessage}</p>}

            <button type="submit" className="btn-primary" disabled={authBusy}>
              {authBusy
                ? "Please wait..."
                : authMode === "signup"
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setAuthMode(authMode === "signup" ? "signin" : "signup");
              setAuthError("");
              setAuthMessage("");
            }}
          >
            {authMode === "signup"
              ? "Already have an account? Sign in"
              : "Need an account? Create one"}
          </button>
        </div>
      </div>
    );
  }

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

        <div className="session-bar">
          <span className="session-email">Signed in as {session.user.email}</span>
          <button type="button" className="btn-signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>

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
