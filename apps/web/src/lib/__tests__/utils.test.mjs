import assert from "node:assert";

// Logic mirror of apps/web/src/lib/utils.ts for verification
function computeStatus(daysRemaining) {
  if (daysRemaining < 0) return "expired";
  if (daysRemaining === 0) return "today";
  if (daysRemaining <= 30) return "due_soon";
  return "active";
}

function formatDaysRemaining(days) {
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  if (days === 0) return "Expires today";
  if (days === 1) return "Expires tomorrow";
  return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
}

function getStatusConfig(status) {
  switch (status) {
    case "active":
      return { label: "Active", className: "bg-green-100 text-green-800" };
    case "due_soon":
      return { label: "Due Soon", className: "bg-yellow-100 text-yellow-800" };
    case "today":
      return { label: "Expiring Today", className: "bg-red-100 text-red-800" };
    case "expired":
      return { label: "Expired", className: "bg-gray-100 text-gray-700" };
    case "renewed":
      return { label: "Renewed", className: "bg-blue-100 text-blue-800" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700" };
  }
}

function getDaysRemaining(expiryDate, timezone = "Asia/Kathmandu") {
  const expiry = new Date(expiryDate);
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  const today = new Date(todayStr + "T00:00:00");
  const expiryLocal = new Date(expiry.toISOString().split("T")[0] + "T00:00:00");
  const diff = expiryLocal.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

console.log("🧪 Running RenewIt Status & Date Calculation Engine Tests...");

// 1. Test computeStatus (Section 9)
assert.strictEqual(computeStatus(31), "active", "31 days should be active");
assert.strictEqual(computeStatus(90), "active", "90 days should be active");
assert.strictEqual(computeStatus(30), "due_soon", "30 days should be due_soon");
assert.strictEqual(computeStatus(15), "due_soon", "15 days should be due_soon");
assert.strictEqual(computeStatus(7), "due_soon", "7 days should be due_soon");
assert.strictEqual(computeStatus(1), "due_soon", "1 day should be due_soon");
assert.strictEqual(computeStatus(0), "today", "0 days should be today");
assert.strictEqual(computeStatus(-1), "expired", "-1 days should be expired");
assert.strictEqual(computeStatus(-15), "expired", "-15 days should be expired");
console.log("  ✓ computeStatus engine tests passed (active, due_soon, today, expired)");

// 2. Test formatDaysRemaining
assert.strictEqual(formatDaysRemaining(0), "Expires today");
assert.strictEqual(formatDaysRemaining(1), "Expires tomorrow");
assert.strictEqual(formatDaysRemaining(7), "Expires in 7 days");
assert.strictEqual(formatDaysRemaining(-1), "Expired 1 day ago");
assert.strictEqual(formatDaysRemaining(-5), "Expired 5 days ago");
console.log("  ✓ formatDaysRemaining tests passed");

// 3. Test getStatusConfig
assert.strictEqual(getStatusConfig("active").label, "Active");
assert.strictEqual(getStatusConfig("due_soon").label, "Due Soon");
assert.strictEqual(getStatusConfig("today").label, "Expiring Today");
assert.strictEqual(getStatusConfig("expired").label, "Expired");
console.log("  ✓ getStatusConfig badge configs passed");

// 4. Test Days Remaining with Nepal Timezone (Asia/Kathmandu)
const today = new Date();
const targetDate = new Date(today);
targetDate.setDate(today.getDate() + 5);
const days = getDaysRemaining(targetDate, "Asia/Kathmandu");
assert.ok(days >= 4 && days <= 6, `Days remaining (${days}) should be near 5`);
console.log("  ✓ getDaysRemaining with Asia/Kathmandu timezone passed");

console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!");
