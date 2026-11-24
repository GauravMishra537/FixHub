# FixHub User Guide

FixHub is where you take care of everyday office needs in one place. You can report a problem, book a room, ask for equipment, or ask a colleague to explain something. Everything you send is called a **ticket**, and you can follow it from start to finish.

This guide is for everyone who uses FixHub. If you are setting up the project, see the [README](../README.md) instead.

---

## Contents

1. [Getting started](#1-getting-started)
2. [Your dashboard](#2-your-dashboard)
3. [Report an issue](#3-report-an-issue)
4. [Book a room, lab or space](#4-book-a-room-lab-or-space)
5. [Request a resource](#5-request-a-resource)
6. [Ask for help on a topic](#6-ask-for-help-on-a-topic)
7. [The ticket page](#7-the-ticket-page)
8. [My queue: work waiting for you](#8-my-queue-work-waiting-for-you)
9. [Notifications](#9-notifications)
10. [For approvers and admins](#10-for-approvers-and-admins)
11. [Ticket statuses](#11-ticket-statuses)
12. [Common questions](#12-common-questions)

---

## 1. Getting started

### Create your account
1. Open FixHub and choose **Register**.
2. Enter your full name, your work email and a password of at least 8 characters.
3. Open the verification link that is sent to your email. If it does not arrive, use **Resend link** on the same page.
4. An administrator then sets your department and role. Until that is done you may not see everything.

You can also sign in with Google.

### Sign in
Choose **Login** and enter your email and password. If you forget your password, use the password reset link on the login page.

### Your account
Click your name at the top right to open your account page. **Sign out** is next to it. The sun icon switches between light and dark theme.

---

## 2. Your dashboard

The dashboard is your home page. It has four parts.

**The four request cards**
Issue Ticket, Infra Booking, Resource Request and Topic Request. Click one to start a new request.

**My board**
Your tickets, laid out in columns. Use the two views at the top:
- **My Tasks** shows work given to you. The columns are *Working on* and *Resolved*.
- **My Activity** shows what you raised. The columns are *My Requests* (waiting) and *Tracking Status* (picked up or finished).

You can narrow the board with the filters: Category, Priority, Created date, Sort, and Status. Click a card to read the ticket in a side panel, or choose **Open full page**.

**My queue**
Things waiting for you to act on. See [section 8](#8-my-queue-work-waiting-for-you).

**Top bar**
**Dashboard** brings you back home. **All tickets** lists every ticket you are allowed to see, with search and filters. The bell shows your notifications.

A small amber number on **Dashboard** means something in My queue is waiting for you.

---

## 3. Report an issue

Use this for anything that is broken or not working: network, electrical, plumbing, furniture, software.

1. On the dashboard, click **Issue Ticket**.
2. Fill in:
   - **Title**: a short line saying what is wrong.
   - **Description**: what happened, where, and since when.
   - **Category**: type it. Suggestions appear as you type. If yours is new, it is created.
   - **Priority**: Low, Medium, High or Urgent.
   - **Visibility**: *Private* means only you, the person fixing it and admins can see it. *Public* means any signed-in person can see it.
   - **Admin approves the claim** (optional tick): when ticked, the person who wants to take your ticket must be approved by an admin first.
3. Send it. You get a ticket number like `FH-000123`.

### What happens next
1. FixHub sends the ticket to the right department. People in that department see it in **My queue**.
2. One of them takes it. You get a notification saying who.
3. They work on it. They can start it, put it **on hold** with a reason, and resume it.
4. When they mark it **resolved**, you get a notification. Open the ticket and either **confirm** that it is fixed (the ticket closes) or **reopen** it with a reason. The same person then keeps working on it.

You can **cancel** your ticket while it is still New, Open or Assigned.

You can edit the title, description and visibility while the ticket is still waiting or just assigned. Click the text on the ticket page to change it.

---

## 4. Book a room, lab or space

1. Click **Infra Booking** on the dashboard.
2. Choose what you want to book, then the date and time. You can add more than one session in the same request, for example the same room on several days.
3. Add a note about what the booking is for, then send it.

FixHub checks that your time does not clash with someone else's booking.

### What happens next
- An admin approves or rejects the request. You get a notification.
- A request with several sessions can be **partly approved**. The sessions that were approved stay, the others are marked rejected.
- You can **cancel** a booking before it starts. Sessions that have already started stay as they were.
- The booking closes by itself after its last session ends.

---

## 5. Request a resource

Use this for laptops, monitors, projectors, software licences, cloud services and other items on the catalog.

1. Click **Resource Request** on the dashboard.
2. Pick the **kind** (for example Hardware or Software), then the **category** and the **item**. Each item shows how many are left. An item that is out of stock cannot be requested.
3. For physical items, enter the **quantity**. The page shows the maximum for one request. Software, cloud and other digital items are always one request.
4. Enter **Why do you need it?**. This is required.
5. Optional: set **Needed by** (a date), choose a **Priority**, and decide whether it is **Private**.
6. Send it.

### What happens next
1. The approver of the category's department decides first. If the category has no department, an admin decides.
2. Then an admin decides.
3. When it is approved, you can **close** the request once you have received the item.
4. You can **cancel** it while it is pending or approved. Stock held for you is released.

You can see each step on the request card: Author, Department, Admin and Close. Hover over a step to see its details.

---

## 6. Ask for help on a topic

Use this when you are stuck on something and want a colleague who knows it to explain. A topic can be a programming language, a tool, a process or any skill listed in FixHub.

1. Click **Topic Request** on the dashboard.
2. Pick **1 to 3 topics**. If the list is long, use the search box.
3. Give the question a **title**, then describe your problem. Say what you are trying to do, what you tried, and where you are stuck.
4. Choose a priority and whether it is private.
5. Send it. On the next page you can attach screenshots or files.

If nobody has the skill you picked, the form shows a note: *No one has this skill yet*. You can still send it. An admin will choose a helper.

### How you get help
There are two ways:
- Colleagues who have that skill approved on their profile are notified. The first one to click **I can help** gets the ticket.
- Or an admin picks a helper for you.

### Working with your helper
- The helper adds **learning material**: links to articles, videos or documents, plus files and a written explanation.
- When they press **Share explanation**, you are notified.
- Then you choose:
  - **Yes, solved**. The ticket closes.
  - **Not solved yet**. Write what more you need and what is still stuck. The same helper continues.
- If your helper becomes too busy, they press **I'm busy**. The ticket goes back to the queue, and other people with the skill or an admin can pick it up. You are told that a new helper is being found.

You can cancel your question while it is waiting for a helper or being helped.

---

## 7. The ticket page

Every ticket opens in the same layout, either in the side panel or on a full page.

- **Next step** box: the buttons you may press right now. They change with your role and the ticket's status. If a button needs a reason, a box opens first.
- **Title and description.** Click them to edit, if you are allowed to.
- **Details**: status, priority, visibility, category, author, helper or assignee, dates.
- **Attachments**: add files by choosing them or dropping them. Allowed types are png, jpg, pdf, txt, docx and xlsx, up to 25 MB each and 10 files per ticket. Large files upload in parts. You can pause, resume or cancel an upload, and an interrupted upload can be continued by choosing the same file again. The eye icon opens images, PDFs and text files in the page.
- **Comments**: write notes for the people on the ticket (up to 2000 characters). You can delete your own comments.
- **Activity**: a timeline of every change, with who did it and when.

### Who can change what
- The person who raised the ticket edits the title, description and visibility while the status allows it.
- The author and admins can change priority.
- Only people on the ticket and admins can add files, depending on the type. Once a ticket is closed or cancelled, files cannot be added.

If a message says *This ticket was changed by someone else*, choose **Reload**, then try again.

---

## 8. My queue: work waiting for you

**My queue** on the dashboard collects what needs you. It can have up to three parts:

- **Resource requests to approve**: shown to department approvers. Choose **Approve**, or **Reject** (a reason is required).
- **Questions you can help with**: topic questions that match a skill you have. Click **I can help** to take one, or click the card to read it first. If someone else was faster, the card tells you.
- **Waiting for your department**: issue tickets routed to your department that nobody has taken. Click one to read it, then **Claim ticket**. If the author asked for admin approval, the button says **Ask to take it**, and you can **Withdraw claim** while you wait.

Oldest items are shown first. Admins do not have My queue. They use the admin pages.

When you take a ticket, it moves to **Working on** on your board.

---

## 9. Notifications

The bell at the top right tells you when something happens to your tickets or when something needs you. Examples: a ticket was routed to your department, your claim was approved, your ticket was resolved, a booking was approved, a topic question matches your skill.

Click a notification to open the ticket. You can mark one as read, mark all as read, or clear the list.

---

## 10. For approvers and admins

### Department approvers
A person set as the approver for a department sees **Resource requests to approve** in My queue. Their decision is the first of two steps. Rejecting needs a reason that the requester will see.

### Admins
Admins have their own pages in the top bar: Dashboard, Users, Issues, Infra, Resources and Topics.

- **Tickets**: on any open ticket you can assign it to a person, give it to someone else, or take it back while it is only Assigned. For a topic question the picker lists people who hold the matching skill. If nobody does, it lists everyone and shows a warning.
- **Claims**: when a ticket needs approval for claims, you see the people who asked and can approve one or reject with a reason.
- **Infra bookings**: approve or reject. With several sessions the buttons act on all that are still waiting.
- **Resource requests**: after the department, approve or reject. An admin can also change a request's priority and visibility while it is open.
- **Setup**: users and their departments, issue categories, the infra catalog, the resource catalog and its approvers, and skills.

Admins assign tickets. They do not claim them.

---

## 11. Ticket statuses

| Status | What it means |
|---|---|
| New | Waiting for someone in the department to take it |
| Open | Waiting for someone to take it (also used for topic questions waiting for a helper) |
| Assigned | A person has it but has not started |
| In progress | Being worked on |
| On hold | Paused, with a reason |
| Resolved | The work is done. The author confirms or reopens |
| Reopened | The author said it is not solved. The same person continues |
| Closed | Finished and confirmed |
| Cancelled | The author cancelled it |
| Rejected | An approver or admin said no |
| Pending approval | Waiting for the first approver |
| Waiting for admin | The department approved. An admin decides next |
| Approved | Approved. For a booking, the sessions are booked |
| Partially approved | Some booking sessions were approved, some were not |

---

## 12. Common questions

**I cannot see a ticket someone told me about.**
It is probably private. Only the author, the person working on it and admins can open a private ticket.

**I do not see "I can help" on a topic question.**
You need an approved skill that matches one of its topics, you cannot be the author, and nobody else may have taken it. If you said "I'm busy" on it earlier, you cannot take it again.

**My priority or category field is not clickable.**
Only the author and admins can change priority, and only while the status allows it. A topic ticket's category is its first topic and cannot be typed.

**An upload stopped.**
Open the ticket, find the upload in Attachments, and press resume. If the page was reloaded, choose the same file again.

**I do not see the Resource request items I expected.**
The catalog is managed by admins. Ask your admin to add the item or category.

**Who sees my department's tickets?**
People in the department see tickets routed to it, but only public ones in the queue. Private tickets are seen by the author, the person working on it and admins.

**Something looks wrong.**
Reload the page first. If it continues, tell your admin the ticket number and what you did.