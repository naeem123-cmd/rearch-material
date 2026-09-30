"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Package,
  Truck,
  Boxes,
  LogOut,
  Plus,
  Check,
  X,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowRightLeft,
  IndianRupee,
  ShieldCheck,
} from "lucide-react";

type Tab =
  | "dashboard"
  | "requests"
  | "sites"
  | "items"
  | "vendors"
  | "purchases"
  | "stock";

type UserRole = "admin" | "project_manager" | "site_supervisor" | "worker";

function normalizeRole(role: any): UserRole {
  const value = String(role || "worker").toLowerCase().replace(/[-\s]+/g, "_");
  if (value === "admin" || value === "administrator") return "admin";
  if (value === "project_manager" || value === "manager" || value === "pm") return "project_manager";
  if (value === "site_supervisor" || value === "supervisor") return "site_supervisor";
  return "worker";
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<Tab>("dashboard");

  const [sites, setSites] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);

  const [loginMode, setLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  async function loadSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session?.user) {
      await loadProfile(session.user.id);
      await loadAll();
    }

    setLoading(false);
  }

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setProfile(data || { id: userId, role: "worker" });
  }

  async function loadAll() {
    const [
      sitesRes,
      itemsRes,
      tradesRes,
      vendorsRes,
      requestsRes,
      purchasesRes,
      stockRes,
    ] = await Promise.all([
      supabase.from("sites").select("*").order("created_at", { ascending: false }),
      supabase
        .from("items")
        .select("*, categories(name)")
        .order("name"),
      supabase.from("trades").select("*").order("name"),
      supabase.from("vendors").select("*").order("name"),
      supabase
        .from("material_requests")
        .select(`
          *,
          sites(name),
          trades(name),
          items(name, unit),
          profiles(full_name)
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("purchases")
        .select(`
          *,
          sites(name),
          vendors(name),
          items(name, unit)
        `)
        .order("created_at", { ascending: false }),
      supabase
        .from("stock")
        .select(`
          *,
          sites(name),
          items(name, unit)
        `)
        .order("updated_at", { ascending: false }),
    ]);

    setSites(sitesRes.data || []);
    setItems(itemsRes.data || []);
    setTrades(tradesRes.data || []);
    setVendors(vendorsRes.data || []);
    setRequests(requestsRes.data || []);
    setPurchases(purchasesRes.data || []);
    setStock(stockRes.data || []);
  }

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await loadProfile(session.user.id);
        await loadAll();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) setAuthMessage(error.message);

    setAuthLoading(false);
  }

  async function signUp(e: FormEvent) {
    e.preventDefault();

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setAuthMessage(error.message);
    } else {
      setAuthMessage(
        "Account created. Verify your email if Supabase asks for verification."
      );
    }

    setAuthLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  if (loading) {
    return <Loading />;
  }

  if (!session) {
    return (
      <AuthScreen
        loginMode={loginMode}
        setLoginMode={setLoginMode}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        fullName={fullName}
        setFullName={setFullName}
        message={authMessage}
        loading={authLoading}
        signIn={signIn}
        signUp={signUp}
      />
    );
  }

  return (
    <Dashboard
      tab={tab}
      setTab={setTab}
      profile={profile}
      sites={sites}
      items={items}
      trades={trades}
      vendors={vendors}
      requests={requests}
      purchases={purchases}
      stock={stock}
      reload={loadAll}
      logout={logout}
    />
  );
}

/* =========================================================
   AUTH
========================================================= */

function AuthScreen({
  loginMode,
  setLoginMode,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  message,
  loading,
  signIn,
  signUp,
}: any) {
  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-[32px] overflow-hidden border border-white/10 bg-white/[0.03]">

        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <div>
            <p className="text-yellow-400 font-bold tracking-[0.35em] text-sm">
              REARCH DEVELOPERS
            </p>

            <h1 className="text-6xl font-bold mt-8 leading-tight">
              Material
              <br />
              Control.
            </h1>

            <p className="mt-6 text-white/50 text-lg leading-8 max-w-md">
              Control every material request, purchase and stock movement
              across every project site.
            </p>
          </div>

          <p className="text-white/20 text-sm">
            ReArch Material Control • v1.0
          </p>
        </div>

        <div className="p-8 md:p-12">
          <p className="text-yellow-400 font-bold tracking-[0.3em] text-xs">
            REARCH
          </p>

          <h2 className="text-3xl font-bold mt-4">
            {loginMode ? "Welcome back" : "Create account"}
          </h2>

          <p className="text-white/40 mt-2 text-sm">
            {loginMode
              ? "Sign in to your material control system."
              : "Create your company account."}
          </p>

          <form
            onSubmit={loginMode ? signIn : signUp}
            className="mt-8 space-y-4"
          >
            {!loginMode && (
              <Input
                label="Full Name"
                value={fullName}
                onChange={setFullName}
                placeholder="Naeem Saifi"
              />
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="name@company.com"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
            />

            {message && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                {message}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 text-black font-bold py-3.5 hover:bg-yellow-300 transition disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : loginMode
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <button
            onClick={() => setLoginMode(!loginMode)}
            className="w-full mt-6 text-sm text-white/40 hover:text-yellow-400"
          >
            {loginMode
              ? "Don't have an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({
  tab,
  setTab,
  profile,
  sites,
  items,
  trades,
  vendors,
  requests,
  purchases,
  stock,
  reload,
  logout,
}: any) {
  const [mobileMenu, setMobileMenu] = useState(false);

  const pending = requests.filter(
    (r: any) => r.status === "pending"
  ).length;

  const approved = requests.filter(
    (r: any) => r.status === "approved"
  ).length;

  const purchaseValue = purchases.reduce(
    (sum: number, p: any) =>
      sum + Number(p.quantity || 0) * Number(p.rate || 0),
    0
  );

  const role = normalizeRole(profile?.role);
  const canApprove = role === "admin" || role === "project_manager";
  const canManageMasterData = role === "admin" || role === "project_manager";
  const canPurchase = role === "admin" || role === "project_manager";
  const canStock = role !== "worker";

  const nav = [
    ["dashboard", "Dashboard", LayoutDashboard, true],
    ["requests", "Requests", ClipboardList, true],
    ["sites", "Sites", Building2, canManageMasterData],
    ["items", "Materials", Package, canManageMasterData],
    ["vendors", "Vendors", Truck, canManageMasterData],
    ["purchases", "Purchases", IndianRupee, canPurchase],
    ["stock", "Stock", Boxes, canStock],
  ].filter(([, , , allowed]: any) => allowed);

  useEffect(() => {
    const allowed = nav.map(([id]: any) => id);
    if (!allowed.includes(tab)) setTab("dashboard");
  }, [role]);

  return (
    <main className="min-h-screen bg-[#050505] text-white flex">

      {/* SIDEBAR */}

      <aside
        className={`fixed lg:static z-30 inset-y-0 left-0 w-64 border-r border-white/10 bg-[#080808] p-5 transform transition-transform ${
          mobileMenu ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-yellow-400 font-bold tracking-[0.3em] text-xs">
              REARCH
            </p>

            <h2 className="font-bold text-xl mt-1">
              Material Control
            </h2>
          </div>
        </div>

        <nav className="space-y-1">
          {nav.map(([id, label, Icon]: any) => (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setMobileMenu(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition ${
                tab === id
                  ? "bg-yellow-400 text-black font-semibold"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="border border-white/10 rounded-xl p-3 mb-3">
            <p className="text-xs text-white/30">Logged in as</p>
            <p className="text-sm font-medium truncate mt-1">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-yellow-400 mt-1 uppercase">
              {role.replace("_", " ")}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 border border-white/10 rounded-xl py-2.5 text-sm text-white/50 hover:text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <section className="flex-1 min-w-0">

        <header className="h-16 border-b border-white/10 flex items-center justify-between px-5 md:px-8">
          <button
            className="lg:hidden text-white/60"
            onClick={() => setMobileMenu(true)}
          >
            <LayoutDashboard />
          </button>

          <div className="hidden md:block">
            <p className="text-xs text-white/30 uppercase tracking-widest">
              ReArch Developers
            </p>
          </div>

          <button
            onClick={reload}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <div className="p-5 md:p-8 max-w-[1500px] mx-auto">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-yellow-400/10 bg-yellow-400/[0.03] px-4 py-3">
            <ShieldCheck size={17} className="text-yellow-400 shrink-0" />
            <p className="text-xs text-white/50">
              Access level: <span className="text-white/80 font-semibold capitalize">{role.replace("_", " ")}</span>
              {canApprove ? " • Approval access enabled" : " • Approval access restricted"}
            </p>
          </div>

          {tab === "dashboard" && (
            <Overview
              sites={sites}
              requests={requests}
              purchases={purchases}
              pending={pending}
              approved={approved}
              purchaseValue={purchaseValue}
              setTab={setTab}
            />
          )}

          {tab === "requests" && (
            <Requests
              sites={sites}
              items={items}
              trades={trades}
              requests={requests}
              reload={reload}
              canApprove={canApprove}
            />
          )}

          {tab === "sites" && (
            <Sites sites={sites} reload={reload} />
          )}

          {tab === "items" && (
            <Items items={items} reload={reload} />
          )}

          {tab === "vendors" && (
            <Vendors vendors={vendors} reload={reload} />
          )}

          {tab === "purchases" && (
            <Purchases
              sites={sites}
              items={items}
              vendors={vendors}
              purchases={purchases}
              reload={reload}
            />
          )}

          {tab === "stock" && (
            <Stock stock={stock} sites={sites} items={items} reload={reload} />
          )}

        </div>
      </section>
    </main>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  sites,
  requests,
  purchases,
  pending,
  approved,
  purchaseValue,
  setTab,
}: any) {
  return (
    <div>
      <PageTitle
        title="Good morning 👋"
        subtitle="Here's what's happening across your projects."
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-8">

        <Stat
          title="Active Sites"
          value={sites.filter((s: any) => s.status === "active").length}
          icon={<Building2 />}
        />

        <Stat
          title="Pending Requests"
          value={pending}
          icon={<ClipboardList />}
        />

        <Stat
          title="Approved Requests"
          value={approved}
          icon={<Check />}
        />

        <Stat
          title="Purchase Value"
          value={`₹${purchaseValue.toLocaleString("en-IN")}`}
          icon={<IndianRupee />}
        />

      </div>

      <div className="grid xl:grid-cols-3 gap-5 mt-6">

        <div className="xl:col-span-2 border border-white/10 bg-white/[0.03] rounded-2xl p-6">

          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-semibold text-lg">
                Recent Material Requests
              </h3>
              <p className="text-xs text-white/30 mt-1">
                Latest requests across sites
              </p>
            </div>

            <button
              onClick={() => setTab("requests")}
              className="text-yellow-400 text-sm"
            >
              View all
            </button>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 5).map((r: any) => (
              <div
                key={r.id}
                className="border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {r.items?.name}
                  </p>

                  <p className="text-xs text-white/30 mt-1">
                    {r.sites?.name} • {r.trades?.name || "Other"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold">
                    {r.quantity} {r.unit}
                  </p>

                  <Status status={r.status} />
                </div>
              </div>
            ))}

            {requests.length === 0 && (
              <Empty text="No material requests yet." />
            )}
          </div>

        </div>

        <div className="border border-white/10 bg-white/[0.03] rounded-2xl p-6">

          <h3 className="font-semibold text-lg">
            Quick Actions
          </h3>

          <div className="mt-5 space-y-3">

            <QuickButton
              text="New Material Request"
              icon={<Plus size={18} />}
              onClick={() => setTab("requests")}
            />

            <QuickButton
              text="Add Site"
              icon={<Building2 size={18} />}
              onClick={() => setTab("sites")}
            />

            <QuickButton
              text="Add Material"
              icon={<Package size={18} />}
              onClick={() => setTab("items")}
            />

            <QuickButton
              text="Record Purchase"
              icon={<IndianRupee size={18} />}
              onClick={() => setTab("purchases")}
            />

          </div>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   REQUESTS
========================================================= */

function Requests({ sites, items, trades, requests, reload, canApprove }: any) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [siteId, setSiteId] = useState("");
  const [tradeId, setTradeId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [requiredDate, setRequiredDate] = useState("");
  const [purpose, setPurpose] = useState("");

  async function createRequest(e: FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const item = items.find((i: any) => i.id === itemId);
    const qty = Number(quantity);

    if (!siteId || !itemId || !quantity || qty <= 0) {
      alert("Please select a site, material and valid quantity.");
      return;
    }

    // Prevent accidental repeat requests for the same site/material while a request is pending.
    const { data: duplicate } = await supabase
      .from("material_requests")
      .select("id, quantity, status, created_at")
      .eq("site_id", siteId)
      .eq("item_id", itemId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (duplicate) {
      alert(
        `A pending request already exists for ${item?.name || "this material"} at this site (${duplicate.quantity} ${item?.unit || "units"}). Check Requests before creating another one.`
      );
      return;
    }

    // Check existing site stock before purchasing/requesting fresh material.
    const { data: siteStock } = await supabase
      .from("stock")
      .select("quantity")
      .eq("site_id", siteId)
      .eq("item_id", itemId)
      .maybeSingle();

    const availableStock = Number(siteStock?.quantity || 0);
    if (availableStock > 0) {
      const proceed = window.confirm(
        `${availableStock} ${item?.unit || "units"} of ${item?.name || "this material"} is already recorded at this site.\n\nDo you still want to create a new request for ${qty} ${item?.unit || "units"}?`
      );
      if (!proceed) return;
    }

    const { error } = await supabase
      .from("material_requests")
      .insert({
        site_id: siteId,
        trade_id: tradeId || null,
        item_id: itemId,
        requested_by: user.id,
        quantity: qty,
        unit: item?.unit || "pcs",
        urgency,
        required_date: requiredDate || null,
        purpose,
        status: "pending",
      });

    if (error) {
      alert(error.message);
      return;
    }

    setShowForm(false);
    setSiteId("");
    setTradeId("");
    setItemId("");
    setQuantity("");
    setPurpose("");

    await reload();
  }

  async function updateRequest(id: string, status: string) {
    if (!canApprove) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("material_requests")
      .update({
        status,
        approved_by: status === "approved" ? user?.id : null,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await reload();
  }

  const filtered = requests.filter((r: any) => {
    const text = `${r.items?.name || ""} ${r.sites?.name || ""} ${
      r.trades?.name || ""
    }`.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageTitle
          title="Material Requests"
          subtitle="Track every material request by site and trade."
        />

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          New Request
        </button>
      </div>

      {showForm && (
        <div className="mt-6 border border-yellow-400/20 bg-yellow-400/[0.03] rounded-2xl p-6">

          <h3 className="font-semibold text-lg mb-5">
            Create Material Request
          </h3>

          <form
            onSubmit={createRequest}
            className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
          >

            <Select
              label="Site"
              value={siteId}
              onChange={setSiteId}
              options={sites.map((s: any) => ({
                value: s.id,
                label: s.name,
              }))}
            />

            <Select
              label="Trade"
              value={tradeId}
              onChange={setTradeId}
              options={trades.map((t: any) => ({
                value: t.id,
                label: t.name,
              }))}
            />

            <Select
              label="Material"
              value={itemId}
              onChange={setItemId}
              options={items.map((i: any) => ({
                value: i.id,
                label: `${i.name} (${i.unit})`,
              }))}
            />

            <Input
              label="Quantity"
              type="number"
              value={quantity}
              onChange={setQuantity}
              placeholder="10"
            />

            <Select
              label="Urgency"
              value={urgency}
              onChange={setUrgency}
              options={[
                { value: "normal", label: "Normal" },
                { value: "urgent", label: "Urgent" },
                { value: "critical", label: "Critical" },
              ]}
            />

            <Input
              label="Required Date"
              type="date"
              value={requiredDate}
              onChange={setRequiredDate}
            />

            <div className="md:col-span-2 xl:col-span-3">
              <Input
                label="Purpose / Note"
                value={purpose}
                onChange={setPurpose}
                placeholder="Wardrobe, electrical work, kitchen..."
              />
            </div>

            <button className="md:col-span-2 xl:col-span-3 rounded-xl bg-yellow-400 text-black py-3 font-bold">
              Submit Request
            </button>

          </form>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 border border-white/10 rounded-xl px-4">
        <Search size={18} className="text-white/30" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search site, material or trade..."
          className="bg-transparent outline-none py-3 w-full text-sm"
        />
      </div>

      <div className="mt-5 border border-white/10 rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="text-left p-4">Material</th>
                <th className="text-left p-4">Site</th>
                <th className="text-left p-4">Trade</th>
                <th className="text-left p-4">Qty</th>
                <th className="text-left p-4">Urgency</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t border-white/5">

                  <td className="p-4 font-medium">
                    {r.items?.name}
                  </td>

                  <td className="p-4 text-white/60">
                    {r.sites?.name}
                  </td>

                  <td className="p-4 text-white/60">
                    {r.trades?.name || "-"}
                  </td>

                  <td className="p-4">
                    {r.quantity} {r.unit}
                  </td>

                  <td className="p-4">
                    <Status status={r.urgency} />
                  </td>

                  <td className="p-4">
                    <Status status={r.status} />
                  </td>

                  <td className="p-4">
                    {r.status === "pending" && canApprove && (
                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            updateRequest(r.id, "approved")
                          }
                          className="rounded-lg bg-green-400/10 text-green-400 p-2"
                          title="Approve"
                        >
                          <Check size={16} />
                        </button>

                        <button
                          onClick={() =>
                            updateRequest(r.id, "rejected")
                          }
                          className="rounded-lg bg-red-400/10 text-red-400 p-2"
                          title="Reject"
                        >
                          <X size={16} />
                        </button>

                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        </div>

        {filtered.length === 0 && (
          <Empty text="No material requests found." />
        )}

      </div>
    </div>
  );
}

/* =========================================================
   SITES
========================================================= */

function Sites({ sites, reload }: any) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [client, setClient] = useState("");

  async function addSite(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("sites").insert({
      name,
      code: code || null,
      location,
      client_name: client,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setCode("");
    setLocation("");
    setClient("");
    setShow(false);

    await reload();
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-4">
        <PageTitle
          title="Sites"
          subtitle="Manage all active project locations."
        />

        <button
          onClick={() => setShow(!show)}
          className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold flex gap-2 items-center"
        >
          <Plus size={18} />
          Add Site
        </button>
      </div>

      {show && (
        <form
          onSubmit={addSite}
          className="mt-6 grid md:grid-cols-2 gap-4 border border-white/10 bg-white/[0.03] rounded-2xl p-6"
        >
          <Input
            label="Site Name"
            value={name}
            onChange={setName}
            placeholder="G-3535"
          />

          <Input
            label="Site Code"
            value={code}
            onChange={setCode}
            placeholder="G3535"
          />

          <Input
            label="Location"
            value={location}
            onChange={setLocation}
            placeholder="Gurgaon"
          />

          <Input
            label="Client"
            value={client}
            onChange={setClient}
            placeholder="Client name"
          />

          <button className="md:col-span-2 bg-yellow-400 text-black rounded-xl py-3 font-bold">
            Save Site
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">

        {sites.map((site: any) => (
          <div
            key={site.id}
            className="border border-white/10 bg-white/[0.03] rounded-2xl p-6"
          >
            <div className="flex justify-between">
              <Building2 className="text-yellow-400" />

              <Status status={site.status} />
            </div>

            <h3 className="text-xl font-bold mt-6">
              {site.name}
            </h3>

            <p className="text-sm text-white/40 mt-1">
              {site.code || "No code"}
            </p>

            <div className="mt-5 text-sm space-y-2">
              <p className="text-white/50">
                📍 {site.location || "Location not added"}
              </p>

              <p className="text-white/50">
                Client: {site.client_name || "—"}
              </p>
            </div>
          </div>
        ))}

      </div>

      {sites.length === 0 && (
        <div className="mt-6">
          <Empty text="No sites added yet." />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ITEMS
========================================================= */

function Items({ items, reload }: any) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [rate, setRate] = useState("");

  async function addItem(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("items").insert({
      name,
      unit,
      default_rate: Number(rate || 0),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setRate("");
    setShow(false);

    await reload();
  }

  return (
    <div>
      <div className="flex justify-between items-center gap-4">
        <PageTitle
          title="Materials"
          subtitle="Your central material master."
        />

        <button
          onClick={() => setShow(!show)}
          className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold flex gap-2 items-center"
        >
          <Plus size={18} />
          Add Material
        </button>
      </div>

      {show && (
        <form
          onSubmit={addItem}
          className="mt-6 grid md:grid-cols-3 gap-4 border border-white/10 rounded-2xl p-6 bg-white/[0.03]"
        >
          <Input
            label="Material Name"
            value={name}
            onChange={setName}
            placeholder="18mm BWP Plywood"
          />

          <Input
            label="Unit"
            value={unit}
            onChange={setUnit}
            placeholder="sheet"
          />

          <Input
            label="Default Rate"
            type="number"
            value={rate}
            onChange={setRate}
            placeholder="0"
          />

          <button className="md:col-span-3 bg-yellow-400 text-black rounded-xl py-3 font-bold">
            Save Material
          </button>
        </form>
      )}

      <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="text-left p-4">Material</th>
                <th className="text-left p-4">Category</th>
                <th className="text-left p-4">Unit</th>
                <th className="text-left p-4">Default Rate</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-t border-white/5"
                >
                  <td className="p-4 font-medium">
                    {item.name}
                  </td>

                  <td className="p-4 text-white/40">
                    {item.categories?.name || "—"}
                  </td>

                  <td className="p-4">
                    {item.unit}
                  </td>

                  <td className="p-4">
                    ₹{Number(item.default_rate || 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   VENDORS
========================================================= */

function Vendors({ vendors, reload }: any) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gst, setGst] = useState("");

  async function addVendor(e: FormEvent) {
    e.preventDefault();

    const { error } = await supabase.from("vendors").insert({
      name,
      phone,
      gst_number: gst,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setName("");
    setPhone("");
    setGst("");
    setShow(false);

    await reload();
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <PageTitle
          title="Vendors"
          subtitle="Maintain your supplier database."
        />

        <button
          onClick={() => setShow(!show)}
          className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold flex gap-2"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      {show && (
        <form
          onSubmit={addVendor}
          className="mt-6 grid md:grid-cols-3 gap-4 border border-white/10 rounded-2xl p-6"
        >
          <Input
            label="Vendor Name"
            value={name}
            onChange={setName}
            placeholder="ABC Plywood"
          />

          <Input
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="9876543210"
          />

          <Input
            label="GST Number"
            value={gst}
            onChange={setGst}
            placeholder="GSTIN"
          />

          <button className="md:col-span-3 bg-yellow-400 text-black rounded-xl py-3 font-bold">
            Save Vendor
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {vendors.map((vendor: any) => (
          <div
            key={vendor.id}
            className="border border-white/10 bg-white/[0.03] rounded-2xl p-6"
          >
            <Truck className="text-yellow-400" />

            <h3 className="font-bold text-lg mt-5">
              {vendor.name}
            </h3>

            <p className="text-sm text-white/40 mt-2">
              {vendor.phone || "No phone"}
            </p>

            <p className="text-xs text-white/20 mt-2">
              GST: {vendor.gst_number || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   PURCHASES
========================================================= */

function Purchases({
  sites,
  items,
  vendors,
  purchases,
  reload,
}: any) {
  const [show, setShow] = useState(false);

  const [siteId, setSiteId] = useState("");
  const [itemId, setItemId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [invoice, setInvoice] = useState("");

  async function addPurchase(e: FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const qty = Number(quantity);
    const item = items.find((i: any) => i.id === itemId);

    const { data: purchase, error } = await supabase
      .from("purchases")
      .insert({
        site_id: siteId,
        vendor_id: vendorId || null,
        item_id: itemId,
        quantity: qty,
        unit: item?.unit || "pcs",
        rate: Number(rate),
        invoice_number: invoice,
        purchased_by: user.id,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    const { data: existing } = await supabase
      .from("stock")
      .select("*")
      .eq("site_id", siteId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("stock")
        .update({
          quantity: Number(existing.quantity) + qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("stock").insert({
        site_id: siteId,
        item_id: itemId,
        quantity: qty,
      });
    }

    await supabase.from("stock_transactions").insert({
      site_id: siteId,
      item_id: itemId,
      transaction_type: "purchase",
      quantity: qty,
      reference_id: purchase.id,
      notes: `Purchase ${invoice || ""}`,
      created_by: user.id,
    });

    await supabase.from("rate_history").insert({
      item_id: itemId,
      vendor_id: vendorId || null,
      rate: Number(rate),
      purchase_id: purchase.id,
    });

    setShow(false);
    setQuantity("");
    setRate("");
    setInvoice("");

    await reload();
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <PageTitle
          title="Purchases"
          subtitle="Record purchased material and automatically update stock."
        />

        <button
          onClick={() => setShow(!show)}
          className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold flex gap-2"
        >
          <Plus size={18} />
          Record Purchase
        </button>
      </div>

      {show && (
        <form
          onSubmit={addPurchase}
          className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4 border border-white/10 rounded-2xl p-6 bg-white/[0.03]"
        >

          <Select
            label="Site"
            value={siteId}
            onChange={setSiteId}
            options={sites.map((s: any) => ({
              value: s.id,
              label: s.name,
            }))}
          />

          <Select
            label="Material"
            value={itemId}
            onChange={setItemId}
            options={items.map((i: any) => ({
              value: i.id,
              label: `${i.name} (${i.unit})`,
            }))}
          />

          <Select
            label="Vendor"
            value={vendorId}
            onChange={setVendorId}
            options={vendors.map((v: any) => ({
              value: v.id,
              label: v.name,
            }))}
          />

          <Input
            label="Quantity"
            type="number"
            value={quantity}
            onChange={setQuantity}
            placeholder="10"
          />

          <Input
            label="Rate"
            type="number"
            value={rate}
            onChange={setRate}
            placeholder="2500"
          />

          <Input
            label="Invoice Number"
            value={invoice}
            onChange={setInvoice}
            placeholder="INV-001"
          />

          <button className="md:col-span-2 xl:col-span-3 bg-yellow-400 text-black rounded-xl py-3 font-bold">
            Save Purchase + Update Stock
          </button>

        </form>
      )}

      <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-white/[0.03] text-white/40">
              <tr>
                <th className="p-4 text-left">Material</th>
                <th className="p-4 text-left">Site</th>
                <th className="p-4 text-left">Vendor</th>
                <th className="p-4 text-left">Qty</th>
                <th className="p-4 text-left">Rate</th>
                <th className="p-4 text-left">Total</th>
              </tr>
            </thead>

            <tbody>
              {purchases.map((p: any) => (
                <tr
                  key={p.id}
                  className="border-t border-white/5"
                >
                  <td className="p-4">
                    {p.items?.name}
                  </td>

                  <td className="p-4 text-white/50">
                    {p.sites?.name}
                  </td>

                  <td className="p-4 text-white/50">
                    {p.vendors?.name || "—"}
                  </td>

                  <td className="p-4">
                    {p.quantity} {p.unit}
                  </td>

                  <td className="p-4">
                    ₹{Number(p.rate).toLocaleString("en-IN")}
                  </td>

                  <td className="p-4 font-semibold">
                    ₹
                    {(Number(p.quantity) * Number(p.rate)).toLocaleString(
                      "en-IN"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   STOCK
========================================================= */

function Stock({ stock, sites, items, reload }: any) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [fromSite, setFromSite] = useState("");
  const [toSite, setToSite] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const sourceStock = stock.find(
    (s: any) => s.site_id === fromSite && s.item_id === itemId
  );
  const available = Number(sourceStock?.quantity || 0);
  const selectedItem = items.find((i: any) => i.id === itemId);

  async function transferStock(e: FormEvent) {
    e.preventDefault();

    const qty = Number(quantity);
    if (!fromSite || !toSite || !itemId || qty <= 0) {
      alert("Select source site, destination site, material and valid quantity.");
      return;
    }
    if (fromSite === toSite) {
      alert("Source and destination site cannot be the same.");
      return;
    }
    if (qty > available) {
      alert(`Only ${available} ${selectedItem?.unit || "units"} available at the source site.`);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");

      const { data: destination } = await supabase
        .from("stock")
        .select("*")
        .eq("site_id", toSite)
        .eq("item_id", itemId)
        .maybeSingle();

      const { error: sourceError } = await supabase
        .from("stock")
        .update({
          quantity: available - qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sourceStock.id);

      if (sourceError) throw sourceError;

      if (destination) {
        const { error } = await supabase
          .from("stock")
          .update({
            quantity: Number(destination.quantity || 0) + qty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", destination.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("stock").insert({
          site_id: toSite,
          item_id: itemId,
          quantity: qty,
        });
        if (error) throw error;
      }

      await supabase.from("stock_transactions").insert([
        {
          site_id: fromSite,
          item_id: itemId,
          transaction_type: "transfer_out",
          quantity: qty,
          notes: `Transfer to site${notes ? ` • ${notes}` : ""}`,
          created_by: user.id,
        },
        {
          site_id: toSite,
          item_id: itemId,
          transaction_type: "transfer_in",
          quantity: qty,
          notes: `Transfer from site${notes ? ` • ${notes}` : ""}`,
          created_by: user.id,
        },
      ]);

      setShowTransfer(false);
      setFromSite("");
      setToSite("");
      setItemId("");
      setQuantity("");
      setNotes("");
      await reload();
      alert("Stock transferred successfully.");
    } catch (error: any) {
      alert(error?.message || "Stock transfer failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageTitle
          title="Stock"
          subtitle="Live material stock across all project sites."
        />

        <button
          onClick={() => setShowTransfer(!showTransfer)}
          className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold flex items-center justify-center gap-2"
        >
          <ArrowRightLeft size={17} />
          Transfer Stock
        </button>
      </div>

      {showTransfer && (
        <form
          onSubmit={transferStock}
          className="mt-6 border border-yellow-400/20 bg-yellow-400/[0.03] rounded-2xl p-6"
        >
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Select
              label="From Site"
              value={fromSite}
              onChange={setFromSite}
              options={sites.filter((s: any) => s.id !== toSite).map((s: any) => ({ value: s.id, label: s.name }))}
            />
            <Select
              label="To Site"
              value={toSite}
              onChange={setToSite}
              options={sites.filter((s: any) => s.id !== fromSite).map((s: any) => ({ value: s.id, label: s.name }))}
            />
            <Select
              label="Material"
              value={itemId}
              onChange={setItemId}
              options={items.map((i: any) => ({ value: i.id, label: `${i.name} (${i.unit || "pcs"})` }))}
            />
            <Input
              label={`Quantity${available ? ` • Available ${available}` : ""}`}
              type="number"
              value={quantity}
              onChange={setQuantity}
              placeholder="0"
            />
          </div>

          <div className="mt-4">
            <Input
              label="Note (optional)"
              value={notes}
              onChange={setNotes}
              placeholder="e.g. Surplus plywood moved to Site B"
            />
          </div>

          {itemId && fromSite && (
            <p className="mt-4 text-sm text-white/50">
              Available at source: <span className="text-yellow-400 font-semibold">{available} {selectedItem?.unit || "units"}</span>
            </p>
          )}

          <div className="flex gap-3 mt-5">
            <button
              disabled={saving}
              className="bg-yellow-400 text-black rounded-xl px-5 py-3 font-semibold disabled:opacity-50"
            >
              {saving ? "Transferring..." : "Confirm Transfer"}
            </button>
            <button
              type="button"
              onClick={() => setShowTransfer(false)}
              className="border border-white/10 rounded-xl px-5 py-3 text-white/60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {stock.map((s: any) => (
          <div
            key={s.id}
            className="border border-white/10 rounded-2xl bg-white/[0.03] p-6"
          >
            <div className="flex justify-between">
              <Boxes className="text-yellow-400" />
              <span className="text-xs text-white/30">LIVE</span>
            </div>

            <h3 className="font-bold text-lg mt-6">{s.items?.name}</h3>
            <p className="text-sm text-white/40 mt-1">{s.sites?.name}</p>
            <p className="text-4xl font-bold mt-5">{s.quantity}</p>
            <p className="text-sm text-white/30">{s.items?.unit}</p>
          </div>
        ))}
      </div>

      {stock.length === 0 && (
        <div className="mt-6">
          <Empty text="No stock recorded yet. Add a purchase first." />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold">
        {title}
      </h1>

      <p className="text-white/40 mt-2 text-sm">
        {subtitle}
      </p>
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] rounded-2xl p-6">
      <div className="text-yellow-400">
        {icon}
      </div>

      <p className="text-white/40 text-sm mt-5">
        {title}
      </p>

      <p className="text-3xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: any) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-2">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={type !== "date"}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50 placeholder:text-white/20"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: any) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-2">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/50"
      >
        <option value="">Select {label}</option>

        {options.map((option: any) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const normalized = status?.toLowerCase();

  let cls = "bg-white/10 text-white/60";

  if (
    normalized === "approved" ||
    normalized === "active" ||
    normalized === "completed"
  ) {
    cls = "bg-green-400/10 text-green-400";
  }

  if (
    normalized === "pending" ||
    normalized === "urgent"
  ) {
    cls = "bg-yellow-400/10 text-yellow-400";
  }

  if (
    normalized === "critical" ||
    normalized === "rejected"
  ) {
    cls = "bg-red-400/10 text-red-400";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] uppercase font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}

function QuickButton({
  text,
  icon,
  onClick,
}: {
  text: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full border border-white/10 rounded-xl p-4 flex items-center gap-3 text-sm hover:bg-white/5 transition text-left"
    >
      <span className="text-yellow-400">
        {icon}
      </span>

      {text}

      <ArrowUpRight
        size={16}
        className="ml-auto text-white/20"
      />
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-white/10 rounded-2xl p-10 text-center text-white/30 text-sm">
      {text}
    </div>
  );
}

function Loading() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin mx-auto" />
        <p className="text-white/40 mt-4 text-sm">
          Loading ReArch Material Control...
        </p>
      </div>
    </main>
  );
}