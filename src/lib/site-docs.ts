// Pure helpers shared by the browser and the server. No database access here.

export const DOC_SLUGS = ["support-handbook", "documentation"] as const;
export type DocSlug = (typeof DOC_SLUGS)[number];

export const MAX_DOC_BODY = 20000;

export const DEFAULT_DOCS: Record<DocSlug, { title: string; body: string }> = {
  "support-handbook": {
    title: "Support staff handbook",
    body: `## 1. Your role and limits
Support staff help members with access, account problems, and data requests. You act only on the reason and ticket in front of you.
- Staff will never ask a member for their password or OAuth tokens. If a member offers them, do not take them.
- Every action in the panel is logged with your name. Write reasons as if a site admin will read them later.

## 2. Verifying a member before you act
- Confirm who you are speaking with before changing anything.
- Ask for the Discord user ID, not just a name. Name searches can match more than one account.
- Record a ticket reference on every action.

## 3. Diagnostic sessions
- The member generates a support access code. Enter it in Start Diagnostic Session. Codes expire after 10 minutes and work once.
- The member gets a security notice email every time a session is opened. If the member did not ask for help, escalate.
- Banned or suspended accounts cannot open a session.

## 4. Password resets
- Use the Locked-Out User Password Reset tool only after you have verified the member.
- Never read a reset link to the member or paste it into a chat.

## 5. Editing an account
- Search by exact Discord user ID, open the member, then use Edit account.
- You can change the username, change the login email, or unlink a Roblox account. Each change needs a reason of at least 10 characters.
- The member is always sent a security notice. If a member did not request a change, escalate at once.

## 6. Removing data
- Use Actions on the member page. Choose only the item the ticket requires. Each removal is written to the removal log.
- Sign out every session is the first step when an account may be compromised. It deletes nothing.
- Deleting applications, reviews, saved positions, or feedback cannot be undone. Confirm the request in writing first.
- Two-factor resets, removing application messages, and deleting accounts go to a site admin.

## 7. Reports and tickets
- You cannot review a report you filed yourself. Use Withdraw from review, with a reason, or hand it to another staff member.
- Use the status buttons to keep the ticket current. Add a note whenever you change the status.

## 8. When to escalate to a site admin
- The member says they did not make a change, or the account shows activity they did not do.
- The request involves a community owner, a ban, an appeal decision, or a staff role.
- A member is at risk of harm, or shares personal data about someone else. Follow crisis guidance and escalate immediately.
- Anything you are unsure about. Asking before acting is always acceptable.

## 9. Closing a ticket
- Confirm the problem is resolved, then set the ticket to Resolved with a short note of what was done.
- Set it to Waiting on user while you wait for a reply.`,
  },
  documentation: {
    title: "Staff documentation",
    body: `## Welcome
This page holds general documentation for support staff. The founder can edit it from the founder console.
- Add links to tools, contacts, and internal references here.`,
  },
};

export type DocSection = { heading: string; blocks: { kind: "p" | "ul"; items: string[] }[] };

/** Splits a document body into sections. "## " starts a section, "- " lines form a list, other lines are paragraphs. */
export function parseDoc(body: string): DocSection[] {
  const sections: DocSection[] = [];
  let current: DocSection = { heading: "", blocks: [] };
  const push = () => { if (current.heading || current.blocks.length) sections.push(current); };

  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("## ")) {
      push();
      current = { heading: line.slice(3).trim(), blocks: [] };
    } else if (line.startsWith("- ")) {
      const last = current.blocks[current.blocks.length - 1];
      if (last && last.kind === "ul") last.items.push(line.slice(2).trim());
      else current.blocks.push({ kind: "ul", items: [line.slice(2).trim()] });
    } else {
      const last = current.blocks[current.blocks.length - 1];
      if (last && last.kind === "p") last.items.push(line);
      else current.blocks.push({ kind: "p", items: [line] });
    }
  }
  push();
  return sections;
}
