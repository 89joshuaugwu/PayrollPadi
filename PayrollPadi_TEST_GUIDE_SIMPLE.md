# PayrollPadi — How to Test the Website (Simple Guide)

This guide is written so that **anyone can follow it**, even if you don't know anything about computers or coding. Just follow the steps in order, click exactly where it says to click, and tick the box if what you see matches what's expected.

You do not need to understand how the website works. You only need to click buttons and read what's on the screen.

---

## Before You Start

You will need:

1. **The website address** (a link that starts with `https://` — ask Joshua for it).
2. **One Admin login** (email + password) — this is the "Manager" account that can see everything.
3. **At least one Employee login** (email + password) — this is a normal staff account.

You will test the website **twice**: once logged in as the Admin, and once logged in as an Employee. Think of it like testing a school portal — once as the school's admin office, and once as a student.

☐ **Tick this box once you have the website link, the Admin login, and at least one Employee login.**

---

## Part 1 — Logging In

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Open the website link in your browser (Chrome, Safari, Edge — any browser is fine) | A page with the PayrollPadi logo and a "Login" button | ☐ |
| 2 | Click **Login** | A simple page with two boxes: **Email** and **Password** | ☐ |
| 3 | Type the Admin email and password, then click **Login** | You are taken to a dashboard (a page full of numbers and menu items on the left) | ☐ |
| 4 | Look at the menu on the left side of the screen (or at the bottom of the screen if you're on a phone) | You should see: **Employees, Payroll, Tax Settings, Reports, Settings** | ☐ |
| 5 | Try typing the wrong password on purpose, then click Login | A small message pops up saying the email or password is wrong. You are NOT let in. | ☐ |
| 6 | Click **Logout** at the bottom of the menu | You are sent back to the Login page | ☐ |
| 7 | Log in again, but this time use an **Employee's** email and password | You are taken to a dashboard, but the menu on the left is different — it only shows **My Payslips** and **My Profile** | ☐ |

**Why this matters:** Admins (managers) should see everything. Employees (staff) should only see their own information. This is like how a bank teller can see all accounts, but a customer can only see their own account.

---

## Part 2 — Testing as the Admin (Manager)

Log in with the **Admin** account for this whole section.

### 2A. Adding a Staff Member

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Click **Employees** in the menu | A list/table of all staff members, with their names and pay amounts | ☐ |
| 2 | Click the **Add Employee** button (usually top-right) | A form appears asking for the person's name, email, department, bank details, and salary | ☐ |
| 3 | Fill in all the boxes with test information (e.g. Name: "Test Person", any email, any department) and fill in a salary amount | As you type numbers into the salary boxes, a total ("Gross Pay") updates automatically at the bottom, without you clicking anything | ☐ |
| 4 | Click **Create Employee** (or similar submit button) | You're taken to that person's profile page, and a message pops up saying the employee was added | ☐ |
| 5 | Go back to the Employees list | The new test person now appears in the list | ☐ |
| 6 | Click on the new test person's name | Their details open — you should see their salary, bank info, and a button to mark them Active/Inactive | ☐ |
| 7 | Click **Mark Inactive** | Their status label changes to "Inactive" (usually shown in grey) | ☐ |
| 8 | Click the same button again (it should now say **Mark Active**) | Their status goes back to "Active" (usually shown in green) | ☐ |

### 2B. Setting Up Tax Rules (only needs to be done once)

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Click **Tax Settings** in the menu | If this is the first time, you'll see a button that says something like **Seed NTA 2025 Defaults** | ☐ |
| 2 | Click that button | A table appears showing 6 rows of tax bands (income ranges and percentages) | ☐ |
| 3 | Try changing one of the percentage numbers, then click **Save as New Version** | A message confirms it saved, and a new entry appears in a "Version History" list at the bottom — the OLD version is still there too, it doesn't disappear | ☐ |

**Why this matters:** Tax rules in Nigeria change over time. The system keeps a history so that old payslips never get accidentally changed when tax rules are updated later — like keeping old receipts instead of throwing them away when prices change.

### 2C. Running Payroll (Paying Staff)

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Click **Payroll** in the menu, then click **New Payroll Run** | Step-by-step screens appear, starting with choosing a month | ☐ |
| 2 | Pick any month and click **Next** | The next screen shows a list of active staff and a warning if anyone's salary information is incomplete | ☐ |
| 3 | If there's a warning, go fix that person's salary first (repeat step 2A.6-2A part), then come back and try again | The warning disappears once fixed | ☐ |
| 4 | Click **Next**, then **Run Payroll** | A loading bar fills up saying "Processing X of Y employees..." | ☐ |
| 5 | When it finishes, click **View Results** | A table appears showing every employee's pay, tax, and take-home amount for that month | ☐ |
| 6 | Click **Lock Payroll Run** | A pop-up warns you this cannot be undone — click to confirm | ☐ |
| 7 | Wait a few seconds | A message confirms the payroll is locked and payslips have been emailed | ☐ |
| 8 | Check the test email address(es) you used for your test staff | Each person should have received an email with a PDF payslip attached | ☐ |
| 9 | Open the attached PDF | It should look neat and professional — company name at top, pay breakdown in the middle, and a highlighted "Net Pay" (take-home amount) near the bottom | ☐ |

### 2D. Checking Reports

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Click **Reports** in the menu | Boxes showing total money spent on payroll, and simple charts | ☐ |
| 2 | Look at the charts | One chart is a line graph (cost over time), another is bars (cost per department) | ☐ |
| 3 | Click **Export CSV** | A file downloads to your computer that you can open in Excel | ☐ |

---

## Part 3 — Testing as an Employee (Staff Member)

Log out, then log back in using an **Employee** account for this section.

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Look at the main dashboard page after logging in | A summary card showing your latest pay and a "View full payslip" link | ☐ |
| 2 | Click **My Payslips** in the menu | A list of your past payslips, most recent at the top | ☐ |
| 3 | Click on one payslip | Full details open: your salary, deductions, and take-home pay | ☐ |
| 4 | Click **Download PDF** | The same PDF you'd get by email downloads to your computer | ☐ |
| 5 | Click **My Profile** in the menu | Your personal details show (name, department, salary) — most of this is locked and cannot be edited by you | ☐ |
| 6 | Scroll to **Bank Details** and enter a new (test) account number and bank name, then click **Submit Bank Change** | A message confirms your request was sent for approval — your bank details do NOT change immediately | ☐ |
| 7 | Refresh the page | A yellow message appears saying your bank change is "pending approval" | ☐ |

**Why this matters:** If staff could change their own bank account instantly, someone could hack an account and redirect a salary payment. Requiring manager approval protects everyone's money.

### Confirming the Approval (switch back to Admin)

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Log out, log back in as Admin | You're on the Admin dashboard | ☐ |
| 2 | Go to **Employees**, click the employee who just requested a bank change | A yellow box appears showing their requested new bank details | ☐ |
| 3 | Click **Approve Bank Change** | The yellow box disappears, and the employee's official bank details update | ☐ |
| 4 | Log out, log back in as that Employee, check **My Profile** | Their bank details now show the new, approved information | ☐ |

---

## Part 4 — Notifications (Bell Icon)

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | As Employee, after a payroll has been locked (Part 2C), look at the bell icon at the top of the screen | A small red number badge appears on the bell | ☐ |
| 2 | Click the bell | A message appears saying your payslip is ready | ☐ |
| 3 | Click the message | The red number goes away (it's now marked as read) | ☐ |

---

## Part 5 — Testing on a Phone

Do this on an actual phone, or make your browser window very narrow on a computer.

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Open the website on a phone and log in | The side menu is gone — instead there are icons along the bottom of the screen you can tap | ☐ |
| 2 | Go to Employees (Admin) or My Payslips (Employee) | Instead of a wide table, information shows as easy-to-read stacked cards | ☐ |
| 3 | Try using every button you tested above | Everything should still work the same way, just laid out for a smaller screen | ☐ |

---

## Part 6 — Trying to Break the Rules (Optional but Recommended)

These checks confirm employees can't accidentally (or deliberately) see things they shouldn't.

| # | What to do | What you should see | ✔ |
|---|---|---|---|
| 1 | Log in as an Employee | You only see My Payslips and My Profile in the menu | ☐ |
| 2 | While logged in as that Employee, try typing the website address for the Employees page directly into the browser's address bar (ask Joshua for this exact address if needed) | You get bounced back to your own dashboard with a small message saying "Admins only" | ☐ |
| 3 | Try the same thing for the Payroll, Tax Settings, and Reports pages | Same result each time — you're blocked and sent back | ☐ |

If any of these let you through as an Employee, that's a real problem and should be reported immediately.

---

## What "Good" Looks Like Overall

By the end of this guide, you should have confirmed:

- ✅ Admins can add staff, run payroll, and see reports
- ✅ Employees can only see their own payslips and profile
- ✅ Payslips arrive by email as a proper PDF
- ✅ Bank changes always need manager approval — never automatic
- ✅ The site works on both computer and phone screens
- ✅ Employees are blocked from admin-only pages

If everything above is ticked, the website is working as intended.

---

## If Something Goes Wrong

Write down exactly:
1. Which numbered step you were on
2. What you expected to happen
3. What actually happened (a screenshot helps a lot)

Then send that to Joshua so it can be looked into.
