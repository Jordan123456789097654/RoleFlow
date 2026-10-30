import type { PolicyData } from "@/lib/policies";

// Built-in policy text synchronized with /policies directory.
export const POLICY_DEFAULTS: Record<string, PolicyData> = {
  "privacy": {
    "title": "Privacy Policy",
    "subtitle": "How RoleFlow and its product family collect, use, and protect personal information",
    "updated": "October 30, 2026",
    "sections": [
      {
        "title": "Parent Platform and Products",
        "paragraphs": [
          "RoleFlow is the parent company providing a suite of community management tools. Each product within the family—including ApplyHub by RoleFlow (applyhub.roleflow.site) and upcoming tools such as Roster by RoleFlow—shares a single account identity.",
          "Products within the RoleFlow family share only your username, Discord user ID, and unified authentication status. Data specific to an individual product (such as applications submitted through ApplyHub) stays isolated to that product workflows.",
          "You have the right to request a full cross-product data export or permanent deletion of your account across all RoleFlow products via Settings at any time."
        ]
      },
      {
        "title": "Who we are",
        "paragraphs": [
          "RoleFlow is operated by the RoleFlow Project Team, referred to in this policy as \"RoleFlow\", \"we\", or \"us\". RoleFlow provides a platform that communities use to receive, organize, and review applications from people who want to join them.",
          "For privacy questions, requests, and data inquiries, email support@roleflow.site. You can also reach our official community on Discord at https://discord.gg/tKPbCXbmr9. Please use email for formal privacy requests so that there is a written record of them. The Discord community is useful for general questions, but it is not the channel for verifying identity or handling a formal request."
        ]
      },
      {
        "title": "Definitions",
        "paragraphs": [
          "To make this policy easier to read, a few terms are used throughout with specific meanings.",
          "Community means a Discord server or group that uses RoleFlow to receive applications. A community has one or more owners and may have staff members with defined permissions.",
          "Applicant means a person who submits an application to a community through RoleFlow.",
          "Staff means people who hold a role within a community, such as reviewers, and people who hold a permission on the platform itself.",
          "Site administrator means a person with elevated permissions across the RoleFlow platform. The Platform Founder is the account that holds the highest level of platform control.",
          "Personal information means any information that identifies you or could reasonably be linked to you. Where this policy says \"information\", it generally means personal information."
        ]
      },
      {
        "title": "How the Service works",
        "paragraphs": [
          "Understanding the flow of information helps explain the rest of this policy. A typical use of RoleFlow looks like this. You sign in with your Discord account. You may link a Roblox account if a community asks for one. You then find a community and submit an application, which can include answers to questions the community has set, links you choose to share, and portfolio items. The application is delivered to that community, where its owners and staff can read it, add reviews and internal notes, and update its status. You can see the status history of your own application.",
          "Because the community receives and holds your application, the community has its own role in your information, which is discussed in Section 9. RoleFlow is the platform that makes the exchange possible and stores the information on the community's behalf."
        ]
      },
      {
        "title": "Information we collect",
        "paragraphs": [
          "We collect information in four main ways: information you give us directly, information we receive from Discord or Roblox when you connect those accounts, information generated when you use the Service, and information about the technical operation of the Service.",
          "Account information from Discord",
          "When you sign in with Discord, we store your Discord user ID, your username, your display name, your avatar, and your email address if you grant that permission. The Discord user ID is the stable identifier we use to recognize your account, so it is kept even if your username changes.",
          "Roblox information, if you link an account",
          "If you choose to link a Roblox account, we store your Roblox user ID, your Roblox username, your avatar, and your account age. Linking is optional on most of the Service, but some communities require a linked Roblox account before you can apply to them. Those requirements are set by each community, not by RoleFlow.",
          "Application information you provide",
          "When you apply to a community, we store the answers you give to its questions, any links you upload, the portfolio items you attach, and the history of your application's status. A status history records each change, such as an application moving from submitted to under review, so that you and the community can see how it progressed.",
          "Community and staff information",
          "Staff who use RoleFlow generate information too. This includes messages exchanged about applications, reviews and votes on applicants, internal notes, staff permissions, and the community settings they configure. Internal notes and reviews are visible to the community's owners and staff, and are generally not visible to the applicant. Where a note is about you, it is still personal information about you, and you can ask for it through the process in Section 17.",
          "Security and account records",
          "To keep accounts safe, we keep some records that are specific to security. These include login device records: a hash of your browser's user-agent string, the dates the device was first and last seen, and the browser name. The hash lets us recognize a returning device without storing the full string. We also keep these records to send new-device alerts. Site administrators must use two-factor authentication. For those accounts we store the two-factor secret in encrypted form and recovery codes in hashed form, so the codes themselves cannot be read back. We also keep audit log entries that record privileged actions, such as changes to permissions or moderation decisions.",
          "Technical information",
          "The Service produces operational records. These include error and delivery records, which help us diagnose why a notification or page failed. We use IP-address-based rate limit counters to slow down abusive traffic. These counters are held briefly in memory and are not used to build a profile of you. Our hosting provider also keeps standard request logs as part of running its infrastructure.",
          "Cookies and local storage",
          "We use cookies and browser local storage to keep you signed in and to make the Service work. Our Cookie Policy describes each of them in more detail.",
          "A summary table",
          "The table below summarizes the main categories, who they relate to, and why they exist.",
          "Category: Discord account details. Who it relates to: Everyone who signs in; Main purpose: Identifying the account and showing the profile",
          "Category: Roblox details. Who it relates to: People who link Roblox; Main purpose: Verifying the account and showing it to communities",
          "Category: Application content. Who it relates to: Applicants; Main purpose: Delivering applications to communities",
          "Category: Reviews, notes, settings. Who it relates to: Community staff and owners; Main purpose: Running the review process",
          "Category: Device and security records. Who it relates to: Everyone who signs in; Main purpose: Protecting accounts and alerting you to new devices",
          "Category: 2FA secrets and recovery codes. Who it relates to: Site administrators; Main purpose: Protecting privileged accounts",
          "Category: Audit logs. Who it relates to: Anyone who performs privileged actions; Main purpose: Accountability and security",
          "Category: Error and request logs. Who it relates to: Everyone using the Service; Main purpose: Keeping the Service running"
        ]
      },
      {
        "title": "How we use information",
        "paragraphs": [
          "We use information for three broad purposes.",
          "To provide the Service. This includes signing you in, showing and routing applications to the right community, sending notifications, and running community features such as reviews and status updates. Without these uses, the Service could not do what it is for.",
          "To keep the Service secure. We use information to detect abuse, enforce our rules, prevent fraud, and investigate reports. For example, if many accounts submit the same application within minutes, that pattern may indicate spam, and we may use the device and rate limit records to look into it. Our Community Guidelines describe the rules we enforce.",
          "To run the business. This includes providing support, improving the Service, and measuring aggregate usage such as weekly community counts. Aggregate measures describe how the Service is used as a whole and are not used to single out individuals. Where possible, we prefer aggregate data over identifiable data for these purposes.",
          "We also use information to comply with the law and to respond to valid legal requests. We only disclose information in response to a legal request that we consider valid, and where the request is broader than necessary we will seek to narrow it."
        ]
      },
      {
        "title": "Legal bases (EEA and UK)",
        "paragraphs": [
          "If the General Data Protection Regulation (GDPR) or the UK GDPR applies to our processing, the law requires us to identify a legal basis for each purpose. We rely on the following.",
          "Performance of a contract. When you ask us to provide the Service, for example by submitting an application or signing in, we process the information needed to deliver what you asked for.",
          "Legitimate interests. We rely on our legitimate interests in keeping the Service secure, preventing abuse, producing aggregate analytics, and running the business. We weigh these interests against your rights and freedoms. Where your rights would outweigh our interest, we will not rely on this basis. You can object to processing based on legitimate interests, as described in Section 16.",
          "Consent. Some features are optional, including linking a Roblox account and receiving email notifications. We rely on your consent for these. You can withdraw consent at any time, and withdrawing it does not affect the lawfulness of processing carried out before you withdrew.",
          "Legal obligation. Where a law requires us to keep or disclose certain information, we process it on that basis."
        ]
      },
      {
        "title": "Who sees your information",
        "paragraphs": [
          "Information on RoleFlow is visible to different people for different reasons. Being clear about this helps you decide what to share.",
          "Community owners and staff can see the applications and applicant information submitted to their community. This includes linked Discord and Roblox details and any reviews and notes that staff add. Staff within a community can see what their role allows, and owners can set those permissions.",
          "Site administrators and the Platform Founder can see account, moderation, and audit information needed to operate the platform. This access is limited to what is needed for that work and is governed by the rules in our Community Guidelines. Access to privileged records is logged.",
          "Service providers process information on our behalf under contract. Discord handles sign-in and message delivery, and it is based in the United States. Resend handles transactional email, such as status and security emails, and it is based in the United States. We also use hosting and PostgreSQL cloud database infrastructure, which stores the platform's data.",
          "Other people you choose to share with. If you share a link or a portfolio item, the people who can see it depend on how it was shared. Anything you post publicly on Discord, or in a community, is visible according to that platform's and that community's rules.",
          "We do not sell your personal information. We do not use advertising cookies, and we do not share personal information for cross-context behavioral advertising."
        ]
      },
      {
        "title": "Data we receive from Discord and Roblox",
        "paragraphs": [
          "Discord",
          "When you sign in with Discord, we receive the profile details that Discord makes available to us under the permissions you grant. These typically include your username, display name, avatar, and email address if you allow it. Each time you sign in, we refresh the username, display name, avatar, and email address from Discord. The exception is an email address you have removed from your RoleFlow account, which is not copied back in; Section 11 explains this.",
          "We do not receive your Discord password. We do not receive your messages, and we do not receive your friends list.",
          "Roblox",
          "If you link a Roblox account, we receive your public Roblox user ID, username, avatar, and account age. We use this to confirm that the account exists and to display it to the communities you apply to. We do not receive your Roblox password, because Roblox handles its own sign-in. Roblox's privacy policy applies to the information Roblox holds about you."
        ]
      },
      {
        "title": "Communities as separate controllers",
        "paragraphs": [
          "Each community that receives your application decides how long it keeps the information you submitted and what it does with it. RoleFlow stores that information on the community's behalf and follows the community's instructions when handling it. However, once a community holds your application, the community is responsible for its own copies, exports, and retention decisions.",
          "In practical terms, this means a community may keep your application after you ask RoleFlow to remove it, if the community has exported it or has its own record. If you want a community to delete your application or stop holding your information, ask the community directly. You can also withdraw your application from its application page. If a community does not respond to a reasonable request, you can contact us at support@roleflow.site and we will help as far as we are able.",
          "Your data export includes the applications you submitted and the messages you sent, so you can see what each community holds. It does not include copies a community has exported on its own, because we do not control those copies."
        ]
      },
      {
        "title": "Automated processing",
        "paragraphs": [
          "RoleFlow provides tools that help community staff organize their work. These include sorting applications, assigning reviewers, flagging items for a second opinion, and showing open workload. These tools make it easier for people to manage large numbers of applications.",
          "These tools do not make hiring or acceptance decisions. Decisions about applications are made by community owners and staff, who are responsible for them. If you believe a decision about your application was unfair, your first step is to raise it with the community.",
          "We do not use fully automated means to make decisions about you that have legal or similarly significant effects. If that changes, we will tell you in advance, explain what the process involves, and explain how you can ask for a human review."
        ]
      },
      {
        "title": "Removing specific information",
        "paragraphs": [
          "You do not have to delete your entire account to remove particular information. In Settings, open the Danger Zone and use the Remove specific data panel. From there you can remove:",
          [
            "the email address stored on your RoleFlow account",
            "your verified company email",
            "your Roblox link",
            "your saved profile answers",
            "server-side copies of unsubmitted application drafts",
            "the browser records we keep for new-device alerts"
          ],
          "Removing an item takes effect in our active systems straight away. Copies that exist in database backups are removed as those backups expire, as described in Section 14.",
          "Removing your email address",
          "When you remove your email address, we also turn off email notifications, because there is no longer an address to send them to. We record the removal so that signing in with Discord does not copy the address back onto your account. Without that record, the next sign-in would silently restore the address you had removed.",
          "We do not currently offer a way to restore an email address you have removed. If you want status emails again, you will need to contact support, who can help you set up notifications again.",
          "Removing your Roblox link",
          "Removing your Roblox link clears your Roblox ID, username, and avatar. Some communities require applicants to link a Roblox account before they can apply. If you remove the link, you may need to link it again before applying to those communities.",
          "Your past applications keep the Roblox details that were attached when you submitted them. Those details form part of the application the community received, so they are not removed from the application record. If you want a past application's Roblox details removed, you can ask the community or contact us, as described in Section 9.",
          "Removing saved answers and drafts",
          "Saved profile answers are the reusable responses you store on your profile. Removing them does not affect applications you have already submitted, because those applications hold their own copies of the answers you gave at the time. Server-side drafts are unsubmitted applications stored so you can return to them later. Removing a draft deletes it from our systems and does not affect any application you have submitted.",
          "Removing browser records",
          "The browser records we keep for new-device alerts are the device records described in Section 4.5. Removing them means you may receive a new-device alert the next time you sign in from a device we previously recognized. This is intended, because it is the alert working as designed."
        ]
      },
      {
        "title": "Deleting your account",
        "paragraphs": [
          "You can delete your account from Settings, in the Danger Zone, by typing DELETE to confirm. Deletion is permanent and cannot be reversed.",
          "Before you delete your account, export your data using the download option in Settings. Once the account is gone, the export will no longer be available, so you will not be able to recover a copy from us.",
          "When deletion is blocked",
          "Deletion is blocked in two situations.",
          "First, if you own one or more communities on RoleFlow, you must transfer or delete those communities before deleting your account. A community cannot be left without an owner, because owners are responsible for its applications and staff.",
          "Second, the Platform Founder account cannot be deleted through the Settings page.",
          "What is removed",
          "When your account is deleted, we remove:",
          [
            "your profile record",
            "the applications you submitted",
            "the messages and answers attached to those applications",
            "your login device records",
            "your saved drafts",
            "the review records you created as a staff member"
          ],
          "The communities you applied to lose access to your applications at that point, because the applications are removed along with your account. A community's own copies, as described in Section 9, are not affected by our deletion.",
          "What is kept",
          "Some information is kept after deletion, for specific reasons.",
          "Audit log entries that record privileged actions remain for security and accountability. These entries may still refer to your user ID, so that the record of what happened remains accurate. Punishment, ban, and safety records are kept for as long as needed to enforce our policies and to prevent people removed for serious violations from returning. We keep only what those purposes require, and we limit who can access it."
        ]
      },
      {
        "title": "Retention",
        "paragraphs": [
          "We keep account information for as long as your account exists. Applications remain with the community that received them, subject to that community's own retention practices, as set out in Section 9.",
          "When you delete your account, we delete your profile and the applications you submitted, as described in Section 12. Some records are kept for longer where the law requires it, for security, or to resolve disputes. These include audit log entries and punishment records, as described above.",
          "Where a retention period is not stated in this policy, we keep information only as long as it is needed for the purpose it was collected for."
        ]
      },
      {
        "title": "Backups",
        "paragraphs": [
          "Our database is backed up by our hosting and database providers so that we can recover from failures. When you remove information or delete your account, we remove it from our active systems immediately.",
          "Backup copies are then overwritten or expire on the provider's regular schedule. During that period, backup copies remain under the same security controls as live data, and they are not used for any other purpose.",
          "This means that deleted information may still exist in backups for a limited time. We are open about this so that you can make an informed decision before you delete something."
        ]
      },
      {
        "title": "Security",
        "paragraphs": [
          "We take the protection of information seriously and use a range of measures. Information is encrypted in transit between your browser and our servers. Session cookies are signed, and each is checked against a version number stored for your account. This means that we can revoke your sessions, for example if you sign out everywhere or if we detect a compromise.",
          "Site administrators must use two-factor authentication. Access to the platform is controlled by roles, so people see only what their role requires. Privileged actions are recorded in audit logs, which helps us detect misuse and hold people accountable.",
          "No system is perfectly secure. You play an important part in protecting your account. Use a strong, unique password for any linked service, and enable two-factor authentication on your Discord account. If you believe your account has been compromised, sign out of all sessions, change your passwords, and contact support@roleflow.site."
        ]
      },
      {
        "title": "Your rights",
        "paragraphs": [
          "Depending on where you live, you may have some or all of the following rights:",
          [
            "Access: to know what personal information we hold about you and to receive a copy.",
            "Correction: to have inaccurate information corrected.",
            "Deletion: to have your information deleted, subject to the exceptions described in this policy.",
            "Export: to receive your information in a portable format.",
            "Objection and restriction: to object to certain processing, including processing based on legitimate interests, or to ask us to restrict it.",
            "Withdrawal of consent: to withdraw consent at any time where we rely on it.",
            "Complaint: to lodge a complaint with a supervisory authority."
          ],
          "These rights are not absolute. For example, we may need to keep certain records to comply with the law or to protect security, and we will explain when that applies."
        ]
      },
      {
        "title": "How to exercise your rights",
        "paragraphs": [
          "The fastest way to act on your rights is in Settings. You can download a copy of your data, remove specific information, or delete your account at any time. These options do not require you to contact us.",
          "For requests that Settings cannot handle, email support@roleflow.site. Examples include a request for information we hold that does not appear in your export, a correction to information you cannot edit yourself, or a question about how we have used your information. Where possible, send the request from the email address on your account, which helps us match the request to you.",
          "Before we act on a request, we may ask you to confirm your identity. This is usually done by answering questions only you would know, or by signing in again. This protects your information from being disclosed to someone pretending to be you.",
          "We aim to respond within 30 days. If a request is complex or we receive many of them, we may need longer, and we will tell you if so.",
          "We generally do not charge a fee for these requests. If a request is clearly unfounded or repeated excessively, we may refuse it or charge a reasonable fee. In either case we will explain why."
        ]
      },
      {
        "title": "California residents",
        "paragraphs": [
          "California residents have additional rights under the California Consumer Privacy Act as amended by the California Privacy Rights Act (CCPA/CPRA). These include the right to know what personal information we collect, use, and disclose, and the right to request deletion of personal information we have collected.",
          "We do not sell personal information. We do not share personal information for cross-context behavioral advertising. You may exercise your rights through the methods described in Section 17. We will not discriminate against you for exercising these rights."
        ]
      },
      {
        "title": "Children",
        "paragraphs": [
          "The Service is not directed to children under 13, or to the higher minimum age that applies in your country. We do not knowingly collect personal information from children below that age.",
          "If you believe a child has provided information to us, contact support@roleflow.site. We will investigate and delete the information if we confirm it was provided by a child below the applicable age. Parents and guardians who have concerns are welcome to contact us the same way."
        ]
      },
      {
        "title": "International transfers",
        "paragraphs": [
          "We may process information in countries other than the one where you live, including the United States, where Discord and Resend are based. When information is transferred from the EEA or UK to a country without an equivalent level of protection, we rely on appropriate safeguards, such as standard contractual clauses. We also use end-to-end transport encryption to protect information while it moves between systems."
        ]
      },
      {
        "title": "Cookies",
        "paragraphs": [
          "We use cookies and local storage to keep you signed in, remember preferences, and make the Service work properly. Our Cookie Policy describes each one, its purpose, and how long it lasts, and it explains how you can manage them. Blocking some cookies may prevent parts of the Service from working."
        ]
      },
      {
        "title": "Complaints",
        "paragraphs": [
          "If you have a concern about how we handle your information, please contact us first at support@roleflow.site so that we can try to resolve it. We take concerns seriously and would rather fix a problem directly.",
          "If you are not satisfied with our response, you have the right to lodge a complaint with the data protection authority in the country where you live or work, or in the country where the alleged problem occurred. Residents of the EEA and UK can find their authority through their national regulator's website."
        ]
      },
      {
        "title": "Changes to this policy",
        "paragraphs": [
          "We will post changes to this policy here and update the date at the top. For material changes, we will give at least 14 days' notice before they take effect. Where the law requires it, we will seek your consent again before applying the changes to information we already hold about you.",
          "We encourage you to review this policy periodically. Continuing to use the Service after changes take effect means you accept the updated policy, to the extent the law allows."
        ]
      },
      {
        "title": "Contact",
        "paragraphs": [
          "For privacy questions and requests, email support@roleflow.site.",
          "For general questions and community discussion, visit our official community Discord desk at https://discord.gg/tKPbCXbmr9. For formal privacy requests, please use email so there is a written record."
        ]
      }
    ]
  },
  "terms": {
    "title": "Terms of Service",
    "subtitle": "The agreement that governs your use of RoleFlow and its family of products, including ApplyHub and Roster",
    "updated": "October 30, 2026",
    "sections": [
      {
        "title": "RoleFlow Product Family",
        "paragraphs": [
          "RoleFlow operates as a parent company offering a family of dedicated community management, staff recruitment, and operations tools under a single account architecture.",
          "Current and upcoming products include ApplyHub by RoleFlow (the community application platform available at applyhub.roleflow.site), Roster by RoleFlow (staff and member management for Roblox groups), and future products hosted on dedicated subdomains.",
          "These Terms govern your access to the parent company website (roleflow.site) and all products and services offered within the RoleFlow family. Everything in the RoleFlow family is free forever, with no paid tiers, subscriptions, or seat limits."
        ]
      },
      {
        "title": "Agreement to these terms",
        "paragraphs": [
          "These Terms of Service form a binding agreement between you and RoleFlow (\"RoleFlow\", \"we\", \"us\") for use of the RoleFlow website, applications, Discord integration, community features, and related services (together, the \"Service\"). By creating an account, signing in, or otherwise using the Service, you agree to these Terms and to the policies they incorporate: our Privacy Policy, Acceptable Use Policy, Cookie Policy, Billing Policy, and Community Guidelines.",
          "These Terms are meant to be read as a whole. Where a specific policy addresses a topic in more detail, that policy applies to that topic. If a policy conflicts with these Terms, these Terms control unless the policy states otherwise.",
          "If you do not agree to these Terms, do not use the Service. If you use the Service on behalf of a community, company, or other organization, you confirm that you have authority to bind that organization to these Terms, and in that case \"you\" refers to the organization as well as to you personally.",
          "These Terms apply whether you use RoleFlow as an applicant, a community owner, a staff member, or a site administrator. Some sections apply more to one role than another, and the sections on community owners and applicant data are examples of this."
        ]
      },
      {
        "title": "Definitions",
        "paragraphs": [
          "\"Community\" means a Discord server or group that uses RoleFlow to publish positions, receive applications, or organize its review process.",
          "\"Owner\" means a person who holds ownership of a Community on RoleFlow. \"Staff\" means a person who holds a role or permission within a Community or on the platform.",
          "\"Applicant\" means a person who submits an application to a Community through the Service.",
          "\"Content\" means anything you submit, post, upload, or store through the Service, including text, links, images, portfolio items, applications, messages, reviews, notes, and Community descriptions.",
          "\"Site administrator\" means a person with platform-wide permissions for operating and moderating RoleFlow."
        ]
      },
      {
        "title": "Eligibility",
        "paragraphs": [
          "You must be at least 13 years old, or the higher minimum age required by Discord in your country if that is greater, to use the Service. You must also be able to form a binding contract under the law where you live. If you are a minor who is old enough to use the Service under local law, a parent or guardian should be aware of your activity on RoleFlow.",
          "If you use the Service on behalf of an organization, you must be an adult who is authorized to act for it. Using the Service in that capacity does not extend the age requirement to the organization's other members.",
          "If we learn that an account belongs to someone below the minimum age, we will close the account. Where we are able to, we will also delete the personal information associated with that account, in line with our Privacy Policy.",
          "If you are prohibited from using the Service under these Terms, or if we have previously banned your account and the ban has not been lifted, you may not create a new account to get around that restriction."
        ]
      },
      {
        "title": "Accounts and sign-in",
        "paragraphs": [
          "You sign in to RoleFlow with your Discord account through Discord's OAuth sign-in flow. RoleFlow receives the profile information that Discord shares with us under the permissions you grant, which typically includes your username, display name, avatar, and email address if you have allowed it. We do not receive your Discord password.",
          "You must provide accurate information when you sign in and when you complete your profile or any application. You must not impersonate another person, use another person's account, or represent yourself as affiliated with a Community when you are not.",
          "Each account is for one person. You may not share your account, sell or transfer it, or let someone else act through it, except where a Community's internal processes make it clear that a staff member is acting in that role.",
          "If we need to verify your identity to protect your account or to respond to a request, we may ask you to confirm information only you would know, or to sign in again."
        ]
      },
      {
        "title": "Account security",
        "paragraphs": [
          "You are responsible for all activity that takes place on your account, and for keeping your Discord account and any linked service account secure. Use a strong, unique password, and enable Discord's two-factor authentication.",
          "Site staff and administrators must enable two-factor authentication before they can use administrative tools. Recovery codes for two-factor authentication are your responsibility to store safely.",
          "If you believe your account has been compromised, sign out of all sessions where possible, change your passwords, and notify us promptly at support@roleflow.site. We may suspend the account while we investigate.",
          "We may sign you out of the Service, or require you to sign in again, if we detect unusual activity or if a security setting changes."
        ]
      },
      {
        "title": "Communities and owner responsibilities",
        "paragraphs": [
          "A Community owner is responsible for the positions, application questions, Applicant communications, staff access, review processes, and decisions made within that Community. Owners must comply with these Terms, our Community Guidelines, and applicable law, including employment, anti-discrimination, consumer, and data protection law where those laws apply to them.",
          "Owners decide who receives staff access and what each staff member can do. Owners should review staff access regularly, and should remove access when a person no longer needs it.",
          "Owners must not use the Service to collect Applicant information for purposes they have not disclosed to Applicants, to discriminate unlawfully against Applicants, or to request payment, identity documents, or financial details as a condition of applying, unless the request is lawful and clearly explained.",
          "RoleFlow is a tool that Communities use. It does not supervise, approve, or endorse any Community's hiring, recruitment, or membership decisions, and we are not responsible for those decisions."
        ]
      },
      {
        "title": "Staff and permissions",
        "paragraphs": [
          "Staff members act on behalf of the Community that appointed them and must follow these Terms, the Community Guidelines, and any internal rules the Community sets. Staff must not use their access for personal purposes unrelated to the Community's review process.",
          "Owners are responsible for the actions of their staff within RoleFlow, including reviews, notes, status changes, and messages sent through the platform. Staff who receive access to Applicant information must keep it confidential and use it only for the purpose for which it was shared.",
          "If a staff member leaves a Community or no longer needs access, the Community's owner should remove that access promptly."
        ]
      },
      {
        "title": "Applications and applicant data",
        "paragraphs": [
          "When you apply to a Community, your answers, uploaded links, portfolio items, and linked Discord and Roblox details are shared with that Community's owner and staff so they can review your application. RoleFlow does not make hiring or acceptance decisions, and RoleFlow is not a party to the relationship between you and a Community.",
          "Communities are responsible for how they use Applicant data, including how long they keep it and whether they share it further. You can find out more about how a Community handles your information by asking the Community directly, and by reading the Privacy Policy section on communities as separate controllers.",
          "You may withdraw an application from its application page. Withdrawing an application does not necessarily remove the copies a Community has already received or exported, so ask the Community directly if you want those removed.",
          "If you have a concern about how a Community has handled your application, you can report it to us using the Report button on the Community's page. We review reports against our Community Guidelines, but we do not decide whether a Community's hiring decision was correct."
        ]
      },
      {
        "title": "Licenses and paid features",
        "paragraphs": [
          "Some features of the Service are available under a license. Licenses may be scoped to a single Community or to an account, and they may have a set duration. The terms of purchase, pricing, renewal, expiry, and refunds are set out in our Billing Policy, which forms part of these Terms.",
          "We may turn licensing on or off for any feature. While licensing is off for a feature, that feature is available without charge. Before we enable licensing for a feature you are currently using for free, we will give you notice.",
          "A change to licensing will not cause us to delete the data you have created. If a paid feature stops being available because a license has ended, you will still be able to access your data as described in the Billing Policy and our data export tools.",
          "If you believe a charge was made in error, contact support@roleflow.site with the details of the transaction. The Billing Policy describes how refund requests are handled."
        ]
      },
      {
        "title": "Your content",
        "paragraphs": [
          "You keep ownership of the Content you submit to RoleFlow, including Community descriptions, position text, application answers, messages, reviews, and images. These Terms do not transfer ownership of your Content to us.",
          "You grant RoleFlow a worldwide, non-exclusive, royalty-free license to host, store, copy, transmit, display, and back up your Content. This license is limited to what is needed to operate and improve the Service and to show your Content to the people you intend to see it. For example, a Community you apply to can see your application, and your Community's positions are visible to the people who view that Community.",
          "The license ends when you delete the Content or your account, except for copies kept in backups and for records we must retain, as described in our Privacy Policy.",
          "You are responsible for making sure that your Content is accurate, lawful, and that you have the rights needed to submit it. You represent that your Content does not infringe anyone else's rights."
        ]
      },
      {
        "title": "Content we may remove",
        "paragraphs": [
          "We may remove, hide, or restrict any Content that we reasonably believe violates these Terms, the Acceptable Use Policy, or the Community Guidelines, or that we are required to remove by law.",
          "Where practical, we will tell you when we remove or restrict your Content and why, and we will give you a way to appeal under the process described in the Moderation, punishments, and appeals section.",
          "We are not obliged to monitor all Content, but we may review Content when we receive a report, when we investigate a security or abuse concern, or when we are required to do so."
        ]
      },
      {
        "title": "Acceptable use",
        "paragraphs": [
          "You must use the Service in line with our Acceptable Use Policy, which forms part of these Terms. A violation of the Acceptable Use Policy is a violation of these Terms.",
          "Among other things, you may not use the Service to run scams or phishing campaigns, impersonate another person or organization, harass or threaten anyone, send spam, discriminate unlawfully, collect data about people without authorization, or try to interfere with the platform or other people's use of it.",
          "You may not attempt to access accounts, data, or systems you are not authorized to use. You may not reverse engineer the Service, circumvent rate limits, or use automated tools to scrape or harvest data from the Service without our written permission."
        ]
      },
      {
        "title": "Third-party services",
        "paragraphs": [
          "RoleFlow relies on third-party services, including Discord for sign-in and bot delivery, Roblox for account linking and profile information, our email provider, and our hosting and database providers. Those services are governed by their own terms and privacy policies, which apply to your use of them.",
          "We are not responsible for the availability of third-party services, for changes they make, or for how they handle information they hold. We will tell you when a change by a third party materially affects the Service you use.",
          "Community pages may link to third-party sites, including Discord servers and websites run by Communities. We do not control those sites and do not endorse them. Use caution when sharing personal information with anyone outside RoleFlow. Never send money, bank details, or identity documents to someone you have met only through an application."
        ]
      },
      {
        "title": "Beta status and changes to the Service",
        "paragraphs": [
          "RoleFlow is in beta. Features may change, be removed, or be unavailable, and the Service may contain bugs, errors, or interruptions. Beta features are provided to help us improve the Service and may not work as they would in a finished product.",
          "We may modify, suspend, or discontinue any part of the Service at any time. Where a change materially reduces functionality you rely on, we will give reasonable notice where it is practical to do so.",
          "We will try to give at least 14 days' notice of changes to these Terms or to paid features, as described in the Changes to these Terms section and the Licenses and paid features section."
        ]
      },
      {
        "title": "Service availability and maintenance",
        "paragraphs": [
          "We work to keep the Service available, but we do not promise that it will be uninterrupted, timely, secure, or error-free. We may perform scheduled or emergency maintenance, during which some or all features may be unavailable.",
          "We may suspend or limit parts of the Service where needed for security, legal compliance, or to protect other users. We will try to keep these interruptions short and to tell you about them where we reasonably can.",
          "Data backups are made as described in the Privacy Policy. Backups are not a guarantee that any particular data can be restored, and you should keep your own copies of anything that is important to you by using the export tools in Settings."
        ]
      },
      {
        "title": "Moderation, punishments, and appeals",
        "paragraphs": [
          "We may remove Content, pause Communities, restrict features, suspend or ban accounts, and take other action to enforce these Terms and our policies. Our approach is described in the Community Guidelines.",
          "Where practical, we will tell you the reason for any action we take and give you a way to appeal, as described in the Community Guidelines. A signed appeal link is sent with the notice where one is available, and appeals are reviewed by site administrators.",
          "Bans and suspensions end your active sessions. A banned or suspended account may not be used to access the Service, and you may not create a new account to avoid a restriction.",
          "We may take emergency action without prior notice where we believe it is necessary to prevent harm to people, to protect the Service, or to comply with the law. Where we do so, we will explain the action and provide an appeal route as soon as we reasonably can.",
          "To appeal a decision, use the appeal page or email appeals@roleflow.site with the punishment reference. Appeals are reviewed by someone other than the person who made the original decision, where possible."
        ]
      },
      {
        "title": "Suspension and termination",
        "paragraphs": [
          "You may stop using the Service at any time and delete your account from Settings, subject to the restrictions in the Deleting your account section of the Privacy Policy and the Community ownership rule below.",
          "We may suspend or terminate your access if you breach these Terms, if we reasonably believe you are using the Service unlawfully or to harm others, or if we are required to do so by law or to protect the security of the Service.",
          "If you own a Community, you must transfer or delete it before you can delete your account. A Community cannot be left without an owner.",
          "When your access ends, the sections of these Terms that by their nature should survive will continue to apply. This includes your Content licence for backups and retained records, the Disclaimers, the Limitation of liability, the Indemnity, and the Disputes and governing law sections."
        ]
      },
      {
        "title": "Feedback",
        "paragraphs": [
          "If you send us suggestions, ideas, or feedback about the Service, you agree that we may use them without paying you or owing you any other obligation. You are not required to send feedback.",
          "We will not treat feedback as confidential unless we agree to do so in writing. Please do not send us information you consider confidential or sensitive through feedback channels."
        ]
      },
      {
        "title": "Disclaimers",
        "paragraphs": [
          "The Service is provided on an \"as is\" and \"as available\" basis. To the fullest extent permitted by law, we disclaim all warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.",
          "We do not guarantee that a Community will accept your application, that a position will remain open, that any Community's hiring process is fair or lawful, or that any person you meet through the Service is who they say they are. Those matters are between you and the Community or person concerned.",
          "Some jurisdictions do not allow the exclusion of certain implied warranties, so some of these exclusions may not apply to you."
        ]
      },
      {
        "title": "Limitation of liability",
        "paragraphs": [
          "To the fullest extent permitted by applicable law, RoleFlow and its operators will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost opportunities, lost goodwill, or lost data, arising from or related to the Service.",
          "Our total liability for any claim relating to the Service will not exceed the amount you paid us for the Service in the twelve months before the claim.",
          "Some jurisdictions do not allow certain limitations of liability, so some of these limits may not apply to you. Nothing in these Terms limits liability that cannot be limited under applicable law, including liability for fraud, or for death or personal injury caused by negligence."
        ]
      },
      {
        "title": "Indemnity",
        "paragraphs": [
          "You agree to defend and indemnify RoleFlow against claims, losses, and reasonable legal costs arising from your Content, your use of the Service in breach of these Terms, or your violation of anyone else's rights.",
          "This obligation does not apply to the extent a claim is caused by our own wrongful conduct."
        ]
      },
      {
        "title": "Disputes and governing law",
        "paragraphs": [
          "Before starting formal proceedings, please contact legal@roleflow.site so we can try to resolve the issue informally. Any formal dispute will be brought before a competent court, unless applicable consumer protection law gives you the right to bring a claim where you live."
        ]
      },
      {
        "title": "Changes to these Terms",
        "paragraphs": [
          "We may update these Terms from time to time. For material changes, we will give at least 14 days' notice in the Service or by email before the changes take effect.",
          "Continued use of the Service after the effective date means you accept the updated Terms. If you do not agree to them, you should stop using the Service and may delete your account."
        ]
      },
      {
        "title": "General terms",
        "paragraphs": [
          "These Terms, together with the policies they incorporate, are the entire agreement between you and RoleFlow about the Service, and they replace any earlier understanding on the same subject.",
          "If a provision is found to be unenforceable, the rest of these Terms remain in effect. Our failure to enforce a provision is not a waiver of it.",
          "You may not assign these Terms without our written consent. We may assign them to a successor that takes over the Service, and we will notify you if that happens."
        ]
      },
      {
        "title": "Contact",
        "paragraphs": [
          "You can reach the RoleFlow team at the addresses below. Please use the one that fits your question so it reaches the right team faster.",
          [
            "support@roleflow.site: general help with your account, applications, communities, and technical problems.",
            "contact@roleflow.site: general enquiries that do not fit another address.",
            "appeals@roleflow.site: appeals against a moderation decision, punishment, or suspension.",
            "legal@roleflow.site: legal notices, questions about these Terms or other policies, and formal disputes.",
            "partnerships@roleflow.site: partnership and sponsorship enquiries."
          ],
          "For community support, you can also visit our official community server at https://discord.gg/tKPbCXbmr9."
        ]
      }
    ]
  },
  "acceptable-use": {
    "title": "Acceptable Use Policy",
    "subtitle": "Unified moderation and acceptable use rules across all RoleFlow products",
    "updated": "October 30, 2026",
    "sections": [
      {
        "title": "Unified Moderation Across Products",
        "paragraphs": [
          "RoleFlow operates a single, shared moderation team with consistent rules across the parent site, ApplyHub, and all future product subdomains.",
          "Actions taken by the moderation team—such as suspensions, warnings, or blacklists—apply globally across the entire RoleFlow ecosystem. Attempting to bypass a moderation action in one product by accessing another product is strictly prohibited."
        ]
      },
      {
        "title": "Purpose and scope",
        "paragraphs": [
          "This Acceptable Use Policy describes what you may and may not do on RoleFlow. It is part of our Terms of Service, and a violation of this policy is a violation of those Terms.",
          "The policy applies to everyone who uses the Service, including applicants, community owners, staff members, and site administrators. It covers everything you do on RoleFlow, including the content you post, the applications you submit, the messages you send, the reviews and notes you write, and the way you use the Discord integration.",
          "Some rules are stricter for community owners and staff, because they hold information about other people and make decisions that affect them. Where a rule applies only to one role, this policy says so."
        ]
      },
      {
        "title": "Core principles",
        "paragraphs": [
          "RoleFlow exists to help people find genuine opportunities and to help communities review applications fairly. Every rule in this policy serves one of those goals. In practice, that means:",
          [
            "Applicants should be able to trust that the opportunities and communities they see are real, and that their information is used only for the purpose they shared it for.",
            "Communities should be able to rely on RoleFlow to organize applications without being flooded by fake or abusive submissions.",
            "Everyone should be treated with respect, and no one should be targeted, threatened, or exposed."
          ],
          "When a situation is not covered by a specific rule, we will judge it against these principles."
        ]
      },
      {
        "title": "Scams, phishing, and deception",
        "paragraphs": [
          "You may not use the Service to trick people into revealing personal information, passwords, two-factor codes, financial details, or identity documents, or into installing software. Prohibited activity includes:",
          [
            "Creating pages, positions, descriptions, banners, or messages that imitate a login screen or a sign-in flow.",
            "Asking for a password or a two-factor code through any part of the Service or in any message.",
            "Pretending to be Discord, Roblox, RoleFlow, or another company.",
            "Promising prizes, jobs, or giveaways in exchange for personal information.",
            "Asking applicants to \"verify\" an account, pay a fee, or download software through RoleFlow."
          ],
          "Deception also includes misleading descriptions. A position should describe the actual role, the actual commitment, and the actual compensation, if any. Describing an unpaid role as paid, or a role that does not exist as a real opening, is deceptive."
        ]
      },
      {
        "title": "Fake positions and fraud",
        "paragraphs": [
          "Do not post positions that do not exist, or use a position to collect personal information you do not need for a genuine recruitment process. Do not use RoleFlow to run investment schemes, pyramid or multi-level schemes, or other deceptive commercial offers presented as jobs or applications.",
          "You must not ask applicants for money, fees, gift cards, cryptocurrency, bank details, or identity documents as a condition of applying or being accepted. If a community has a lawful reason to request a document later in a hiring process, it must explain the reason clearly and must not request payment for it.",
          "If you are an applicant and you receive a request of this kind, do not send anything. Report it using the Report button. We will investigate and may remove the community, the content, or the account involved."
        ]
      },
      {
        "title": "Spam and fake activity",
        "paragraphs": [
          "Create communities, positions, and applications only for genuine recruitment and membership purposes. Do not submit applications you do not intend to pursue, submit duplicate applications to flood a community, post the same content repeatedly, or create content in bulk to make a community look more active than it is.",
          "Do not use bots, scripts, or additional accounts to create content, submit applications, or influence reviews. Do not create accounts to vote in your own favour, to inflate counts, or to evade a restriction."
        ]
      },
      {
        "title": "Harassment, abuse, and threats",
        "paragraphs": [
          "Do not threaten, harass, intimidate, stalk, bully, or demean any person through RoleFlow. This applies to applicants, staff members, owners, and anyone else. Harassment includes:",
          [
            "Repeatedly contacting someone who has asked you to stop.",
            "Sending abusive or threatening messages through application threads, reviews, or notes.",
            "Encouraging other people to target, pile onto, or retaliate against a person.",
            "Using staff notes, reviews, or decision notes to demean an applicant or to record personal attacks."
          ],
          "Threats of violence are treated as the most serious kind of violation and may be reported to law enforcement."
        ]
      },
      {
        "title": "Doxxing and sharing private information",
        "paragraphs": [
          "Do not post or share someone's private information without their consent, including home addresses, phone numbers, private messages, email addresses, identity documents, private photographs, or the contents of an application that was shared with a community in confidence.",
          "Sharing an applicant's application or personal details outside the Community that received it, or using them for any purpose other than reviewing that application, is prohibited. Community owners and staff must treat applicant information as confidential."
        ]
      },
      {
        "title": "Hate and discrimination",
        "paragraphs": [
          "Do not use the Service to promote hatred, violence, or dehumanization of people based on race, ethnicity, national origin, religion, sex, gender identity, sexual orientation, disability, age, or any other protected characteristic.",
          "Do not use RoleFlow to exclude people from a recruitment or membership process on the basis of a protected characteristic where that is unlawful, and do not use discriminatory language in position descriptions, questions, reviews, or messages."
        ]
      },
      {
        "title": "Unlawful discrimination and screening",
        "paragraphs": [
          "Communities may set requirements that are lawful and relevant to the role, such as experience, portfolio, availability, time zone, or language skills. Those requirements must be applied consistently to every applicant.",
          "Communities must not use RoleFlow to screen out applicants on the basis of protected characteristics where that is unlawful. They also must not collect sensitive information that the role does not need. Questions about health, religion, sexual orientation, pregnancy, family status, or immigration status are generally not appropriate in an application form, and owners should take legal advice before asking about them.",
          "Owners and staff who make decisions about applicants are responsible for ensuring those decisions comply with the law that applies to them."
        ]
      },
      {
        "title": "Minors and child safety",
        "paragraphs": [
          "The Service is not for children under the minimum age described in the Terms of Service. Do not solicit personal information, images, private contact details, or meetings from anyone under 18 through RoleFlow.",
          "Do not create positions, questions, or messages that ask minors for sensitive information, for photographs, or for private contact. Any sexual content involving minors is prohibited. We will remove it, ban the account responsible, and report it to the appropriate authorities.",
          "If you believe a child is at risk or has been approached inappropriately through RoleFlow, report it immediately using the Report button and contact support@roleflow.site. Do not wait for us to act before you report."
        ]
      },
      {
        "title": "Impersonation and false claims",
        "paragraphs": [
          "Do not impersonate another person, a staff member, a verified community, a studio, a company, or RoleFlow itself. Do not claim to be an employee or official representative of anyone you are not.",
          "Do not claim a Roblox or Discord account that is not yours, and do not link a Roblox account to your profile unless you control it. Staff badges, verified labels, partner status, and official names are reserved for accounts that are actually authorized to use them. Do not claim a licence or a feature you do not hold."
        ]
      },
      {
        "title": "Intellectual property",
        "paragraphs": [
          "Do not post content you do not have the right to use. This includes game assets, logos, trademarks, music, artwork, and written material. Respect the copyright, trademark, and other rights of others.",
          "If you believe content on RoleFlow infringes your rights, report it to support@roleflow.site with enough detail for us to identify the material and the rights involved. We may remove the material while we review the report."
        ]
      },
      {
        "title": "Malicious content and unsafe links",
        "paragraphs": [
          "Do not upload or link to malware, phishing pages, or content designed to compromise other people's devices or accounts. Do not share links that imitate Discord or Roblox sign-in pages, or links that redirect people to pages that try to capture their credentials.",
          "Links in application answers, position descriptions, and community pages may be reviewed, and we may remove any link that we believe is unsafe. Where a link is removed, we will tell the person who posted it, where we reasonably can."
        ]
      },
      {
        "title": "Security and abuse of the platform",
        "paragraphs": [
          "Do not attempt to access accounts, data, or systems you are not authorized to use. Do not probe, disrupt, or interfere with the Service, bypass rate limits or licensing limits, bypass access controls, or abuse the Discord integration.",
          "Keep your credentials private. Do not share your session cookies, two-factor recovery codes, bot tokens, or API keys with anyone, and do not publish them in applications, messages, or community pages.",
          "Do not use the Service to send unsolicited messages to people at scale, including through the Discord integration, beyond what a community's own recruitment process needs."
        ]
      },
      {
        "title": "Scraping and automation",
        "paragraphs": [
          "Do not collect information from RoleFlow by automated means, such as scraping community pages, applicant data, or staff information, unless we have given you written permission.",
          "Do not use bots, scripts, or accounts to submit applications at scale, to vote in reviews to manipulate results, or to create content in bulk. Official integrations that we have approved, and integrations that a community has set up for its own use within the terms we publish, are not covered by this restriction."
        ]
      },
      {
        "title": "Responsible disclosure of security issues",
        "paragraphs": [
          "If you find a security vulnerability in the Service, we want to hear about it. Report it to support@roleflow.site with enough detail for us to reproduce the problem, and give us a reasonable opportunity to investigate and fix it before you disclose it publicly.",
          "Do not test for vulnerabilities without our written permission in a way that accesses other people's data, degrades the Service, or disrupts other users. Do not demand payment or other concessions in exchange for not disclosing a vulnerability."
        ]
      },
      {
        "title": "Conduct of community owners and staff",
        "paragraphs": [
          "Community owners and staff hold a position of trust. They must keep applicant information confidential, use their access only for the purposes of their community, and remove staff access when a person no longer needs it.",
          "Owners are responsible for the conduct of the staff they appoint, and must act promptly when they learn that a staff member has broken this policy. Staff who misuse their access may lose it, and the owner may be asked to take further action."
        ]
      },
      {
        "title": "Reporting violations",
        "paragraphs": [
          "You can report a violation using the Report button on a community or position page, or by contacting support@roleflow.site. When you report, include the link to the relevant content, a description of what happened, and any evidence you have. Please do not post private evidence publicly.",
          "We review reports and may remove content, pause or blacklist a community, suspend or ban an account, or close the report without action. We will not always be able to share details of the outcome, especially where doing so would compromise another person's privacy or an investigation.",
          "Reports can be made anonymously within the RoleFlow reporting tools where the tools allow it. Knowingly false reports, or reports made to harass someone, are themselves a violation of this policy."
        ]
      },
      {
        "title": "Enforcement",
        "paragraphs": [
          "We take action in proportion to the seriousness and frequency of a violation. Depending on the circumstances, we may:",
          [
            "Remove or hide content.",
            "Issue a warning.",
            "Limit features on an account or community.",
            "Pause or blacklist a community.",
            "Suspend an account for a fixed period.",
            "Permanently remove an account or community from the Service."
          ],
          "Serious violations, such as threats of violence, child sexual abuse material, fraud, or credible threats to someone's safety, may result in immediate removal, without prior warning, and reporting to law enforcement where required. Repeated violations usually lead to more serious action.",
          "We may also take action against accounts that are linked to a removed account, or that are created to evade a restriction."
        ]
      },
      {
        "title": "Appeals",
        "paragraphs": [
          "If you believe we made a mistake, you can submit an appeal through the appeal page. Appeals are reviewed by someone other than the person who made the original decision, where that is possible.",
          "We will tell you the outcome of your appeal and the reasons for it, subject to the limits described in the Reporting violations section. Appeals follow the process described in the Community Guidelines. Submitting an appeal does not automatically reverse the action, but a successful appeal will be reflected in our records."
        ]
      },
      {
        "title": "Relationship to other policies",
        "paragraphs": [
          "This Acceptable Use Policy works alongside our Terms of Service, Community Guidelines, Privacy Policy, Cookie Policy, and Billing Policy. Where a more specific policy covers a topic, that policy applies to that topic.",
          "The Community Guidelines describe how we expect people to behave on the platform in more detail, and the Privacy Policy explains how we handle personal information. If you are unsure whether something is allowed, ask us before you act."
        ]
      },
      {
        "title": "Changes to this policy",
        "paragraphs": [
          "We may update this policy from time to time. For material changes, we will give at least 14 days' notice in the Service or by email before the changes take effect. Continued use of the Service after the changes take effect means you accept the updated policy."
        ]
      },
      {
        "title": "Contact",
        "paragraphs": [
          "Questions about this policy or reports of violations: support@roleflow.site. For community support, visit our official community server at https://discord.gg/tKPbCXbmr9."
        ]
      }
    ]
  },
  "community-guidelines": {
    "title": "Community Guidelines",
    "subtitle": "Expectations for owners, staff, and applicants, and how enforcement works",
    "updated": "October 29, 2026",
    "sections": [
      {
        "title": "Purpose and scope",
        "paragraphs": [
          "These Community Guidelines set out what we expect from communities, community owners, staff members, and applicants on RoleFlow. They explain how we respond when those expectations are not met and how you can challenge a decision.",
          "These guidelines work alongside our Terms of Service and Acceptable Use Policy. The Acceptable Use Policy sets out what is prohibited. These guidelines explain how people should behave in day-to-day use of the platform, and what happens when they fall short. Where the two overlap, the stricter rule applies."
        ]
      },
      {
        "title": "Our goals",
        "paragraphs": [
          "RoleFlow is meant to make recruiting and joining communities clearer and fairer for everyone involved. We want applicants to know what they are applying for and to be treated with respect. We want communities to be able to find people efficiently and to make decisions in a way they can explain. We want staff to work together without pressure or conflict.",
          "These goals are the reason for the rules below. When a situation is not covered, we will ask what response best serves them."
        ]
      },
      {
        "title": "For community owners",
        "paragraphs": [
          "Owners set the tone for their community and are responsible for its conduct. We expect owners to:",
          [
            "Describe the community and each position honestly. Do not advertise roles you are not hiring for, and do not promise outcomes you cannot deliver.",
            "Ask applicants only for information needed to assess the role. Do not ask for passwords, payment details, bank information, two-factor codes, or identity documents as part of an application.",
            "Give staff only the access they need for their role, and remove access promptly when someone leaves the team or changes role.",
            "Respond to applicants within a reasonable time, and tell them clearly when a decision has been made.",
            "Keep applicant data only for as long as it is needed for the purpose it was collected for, and delete it when an applicant asks where the law requires it.",
            "Make sure the community's requirements are written down, applied consistently, and lawful in the places where the community operates."
          ]
        ]
      },
      {
        "title": "For staff",
        "paragraphs": [
          "Staff members help owners run the review process. We expect staff to:",
          [
            "Review applications on their merits, following the community's written criteria.",
            "Record reasons for decisions where practical, so that decisions can be explained if questioned.",
            "Keep reviews, notes, and messages professional, accurate, and respectful.",
            "Use only the voting and decision permissions the owner has given them, and do not act beyond those permissions.",
            "Declare any conflict of interest, such as a personal or financial relationship with an applicant, and step back from that review.",
            "Never share applicant information outside the community, and never use RoleFlow to make decisions based on protected characteristics."
          ]
        ]
      },
      {
        "title": "For applicants",
        "paragraphs": [
          "Applicants help communities find people who are a good fit. We expect applicants to:",
          [
            "Answer application questions honestly and completely.",
            "Apply only to roles they genuinely intend to pursue.",
            "Avoid submitting several applications to the same role, and avoid flooding a community with applications.",
            "Be respectful in messages to staff, including when a decision is not the one they hoped for.",
            "Keep their own login details private and report any request for a password, payment, or identity document."
          ]
        ]
      },
      {
        "title": "Honest and clear postings",
        "paragraphs": [
          "Every position should describe the role accurately. Say what the work involves, what skills or experience it needs, whether it is paid or unpaid, the expected time commitment, and roughly how long applicants should expect to wait for a decision.",
          "Close positions when they are filled, or when you stop reviewing applications, rather than leaving them open to collect applications you do not intend to consider. Update the posting if the requirements or the role change."
        ]
      },
      {
        "title": "Respectful communication with applicants",
        "paragraphs": [
          "Acknowledge applications, tell applicants when a decision has been made, and explain the reasons where you reasonably can. Use the messaging and interview tools on RoleFlow for conversations about an application, rather than contacting applicants through unrelated channels.",
          "Keep feedback specific and professional. Do not mock, insult, or pressure applicants, including when you decline them. A short, clear, respectful decline is better than silence or a vague message that leaves the applicant guessing."
        ]
      },
      {
        "title": "Handling applicant information",
        "paragraphs": [
          "Applicants share personal information with a community so that the community can consider them for a role. Use that information only to assess the application. Keep it secure, share it only with the people who need it for that purpose, and delete it or stop holding it when it is no longer needed.",
          "Do not copy applicant details into public channels, post screenshots of applications, or use applicant information for marketing or for any purpose the applicant did not agree to.",
          "Owners are responsible for how their staff handle applicant information. If a staff member misuses it, remove their access immediately. Contact us if you need help dealing with the consequences."
        ]
      },
      {
        "title": "Staff conduct and fair review",
        "paragraphs": [
          "Staff should review applications fairly and consistently. Compare applicants against the same criteria, and avoid decisions based on personal dislikes, unrelated disputes, or assumptions about someone's background.",
          "Staff should not share private review notes outside the team, and should not use their access to pursue personal disputes with applicants or other staff members. If a dispute arises between staff, raise it with the owner rather than resolving it through the platform."
        ]
      },
      {
        "title": "Reporting",
        "paragraphs": [
          "If a community, position, applicant, or staff member breaks these guidelines, report it using the Report button on the community or application page. Give specific details about what happened, when it happened, and any evidence you have. Please do not post private evidence publicly.",
          "Several separate reports about the same target are reviewed together, and the number of reporters is one of the signals we consider. Reports are not votes. One serious report can be enough to act on, and many weak or unclear reports do not, on their own, guarantee action.",
          "We do not reveal who reported a community to the community itself. Knowingly false reports, or reports made to harass someone, are themselves a violation of these guidelines."
        ]
      },
      {
        "title": "How we respond",
        "paragraphs": [
          "Our response depends on how serious and how frequent a problem is. The main steps are:",
          [
            "Warning: a notice that a rule was broken, with no restriction on access.",
            "Content removal: content that breaks our rules is removed, with or without any other action.",
            "Pause: a community is hidden from the public directory while the issue is reviewed. The owner can still access the community.",
            "Blacklist: a community is removed from the public listing, and its applications stop being accepted.",
            "Suspension: an account cannot sign in for a set period.",
            "Ban: an account cannot sign in. Bans are usually permanent."
          ],
          "We may skip earlier steps where the situation is serious, such as threats of violence, child safety concerns, or fraud. We may also take action against an account that is linked to a restricted account or created to avoid a restriction."
        ]
      },
      {
        "title": "Notice and appeals",
        "paragraphs": [
          "When we take action against an account or a community, we tell the owner or account holder what action we took and why, unless telling them would be unlawful or would undermine a security investigation. The notice includes an appeal link.",
          "You may submit one appeal per decision, explaining why you think it should be reconsidered. Appeals are reviewed by a site administrator, and we will email you the outcome. A denied appeal is final on the platform, although you may still contact us about your data rights under our Privacy Policy."
        ]
      },
      {
        "title": "Transparency and records",
        "paragraphs": [
          "We keep an audit record of privileged actions, including punishments, role changes, and moderation decisions. Enforcement decisions are recorded so that they can be reviewed later, including when an appeal is considered."
        ]
      },
      {
        "title": "Changes to these guidelines",
        "paragraphs": [
          "We may update these guidelines as the platform and the law change. We will post changes on this page and update the date at the top. For material changes, we will give at least 14 days' notice in the Service or by email before the changes take effect.",
          "If a change affects how communities must run their applications, we will tell community owners in advance where practical."
        ]
      },
      {
        "title": "Contact",
        "paragraphs": [
          "Questions about these guidelines, or reports that need follow-up: support@roleflow.site. For community support, visit our official community server at https://discord.gg/tKPbCXbmr9."
        ]
      }
    ]
  },
  "cookies": {
    "title": "Cookie Policy",
    "subtitle": "The essential cookies and local storage used across RoleFlow and its subdomains",
    "updated": "October 30, 2026",
    "sections": [
      {
        "title": "Purpose of this policy",
        "paragraphs": [
          "This Cookie Policy explains which cookies and local storage items RoleFlow uses, why we use them, how long they last, and how you can control them. It should be read together with our Privacy Policy, which explains how we handle personal information more generally.",
          "We keep our use of cookies and local storage to what is needed to run the Service. We do not use advertising cookies, and we do not use cookies to track you across other websites."
        ]
      },
      {
        "title": "What cookies and local storage are",
        "paragraphs": [
          "A cookie is a small file that a website asks your browser to store. Your browser sends the cookie back to the website on later requests, which lets the website recognize you or remember something between visits.",
          "Local storage is a similar mechanism. It lets a website keep data in your browser, and that data stays there until it is cleared. Unlike cookies, local storage data is not sent to the server with each request.",
          "Both can be used to identify a browser or a session, so we treat them with the same care as other personal information."
        ]
      },
      {
        "title": "Cookies we set",
        "paragraphs": [
          "We set two cookies. Both are essential to the operation of the Service.",
          [
            "roleflow_user_id: keeps you signed in. It contains a signed value that the server checks on each request, so it cannot be changed without the server detecting it. It is marked httpOnly, which means page scripts cannot read it. It lasts 30 days, or until you sign out or your sessions are revoked, whichever comes first.",
            "roleflow_2fa_pending: holds the short-lived step between Discord sign-in and the two-factor check that site administrators must complete. It lasts up to ten minutes and is cleared as soon as the check completes."
          ],
          "Cross-subdomain SSO: The roleflow_user_id cookie is scoped to the shared root domain (.roleflow.site) so you remain authenticated seamlessly between the parent company site and product subdomains such as applyhub.roleflow.site."
        ]
      },
      {
        "title": "Local storage items",
        "paragraphs": [
          "We use local storage for two purposes. Both are stored only in your browser and both are removable.",
          [
            "Application drafts: saved in your browser so that an unsubmitted application is not lost if you close the tab. Drafts stay on the device where they were written and are not synced across your devices by this feature.",
            "Staff overview timestamp: a record of when you last visited each community dashboard, so the overview can show what has changed since then. It contains only the time of your visit."
          ]
        ]
      },
      {
        "title": "Why we use each item",
        "paragraphs": [
          "roleflow_user_id is needed to keep you signed in across page visits. Without it, every page would require you to sign in again. It is the only cookie that identifies your signed-in session.",
          "roleflow_2fa_pending is needed to complete two-factor authentication for site administrators. It exists only between the Discord sign-in step and the second-factor check, and it is removed when that check is complete or when it expires.",
          "Application drafts in local storage let you return to an unsubmitted application on the same device without losing your answers. Server-side copies of drafts are separate and can be removed in Settings, as described in our Privacy Policy.",
          "The staff overview timestamp lets the overview highlight what has changed since your last visit. It does not contain your name or other personal details."
        ]
      },
      {
        "title": "How long they last",
        "paragraphs": [
          "The sign-in cookie lasts up to 30 days, unless you sign out, your sessions are revoked, or the cookie is cleared sooner by your browser. Signing out removes it immediately.",
          "The two-factor cookie lasts ten minutes at most and is removed when the check completes.",
          "Local storage items remain in your browser until you clear them or until the Service removes them. Application drafts and the staff overview timestamp are kept in the same way."
        ]
      },
      {
        "title": "Cookies and tools we do not use",
        "paragraphs": [
          "We do not set advertising cookies or cross-site tracking cookies. We do not use fingerprinting techniques to identify your browser.",
          "We do not currently use analytics cookies. If we add analytics or any other cookie that is not strictly necessary, we will update this policy first, explain what the new item does, and ask for your consent where the law requires it. You will be able to refuse non-essential cookies without losing access to the core Service."
        ]
      },
      {
        "title": "Consent",
        "paragraphs": [
          "The cookies and local storage items described in this policy are strictly necessary to provide the Service you asked for, so we do not ask for consent before setting them. Without them, you could not stay signed in, complete two-factor authentication, or keep your application drafts.",
          "Where we rely on consent for any future cookie, you can withdraw it at any time in the same way you gave it, and withdrawing consent will not affect the lawfulness of anything we did before you withdrew it."
        ]
      },
      {
        "title": "Managing cookies and local storage in your browser",
        "paragraphs": [
          "Every major browser lets you view, block, and delete cookies and local storage. These settings are usually found under privacy or site settings, and you can often clear data for a single site without affecting others.",
          "Clearing RoleFlow's cookies will sign you out. Clearing local storage removes saved application drafts and the staff overview timestamp in that browser. It does not delete anything from your account. If you want server-side copies of drafts removed, use the Remove specific data panel in Settings.",
          "If you block the essential cookies, you will not be able to stay signed in, and you will need to sign in again on each visit. Blocking local storage will prevent drafts from being saved on that device."
        ]
      },
      {
        "title": "Private and incognito browsing",
        "paragraphs": [
          "Many browsers offer private or incognito windows. Cookies and local storage set in those windows are usually removed when the window is closed. Sign-in will not persist in a private window unless you sign in again there.",
          "Using a private window does not change what RoleFlow stores on our servers, such as your account record and any applications you submitted."
        ]
      },
      {
        "title": "Third-party sites and embedded content",
        "paragraphs": [
          "When you sign in with Discord, Discord may set its own cookies on its sign-in pages. Those cookies are governed by Discord's own policies, and we do not control them.",
          "Community pages may embed Discord's public server widget. When the widget loads, Discord may set its own cookies. Those cookies are also governed by Discord's policies.",
          "Links to Roblox, Discord, community websites, and other external sites take you away from RoleFlow. Their cookie practices apply once you are on their sites, and you should review their policies."
        ]
      },
      {
        "title": "Hosting and server logs",
        "paragraphs": [
          "Our hosting provider receives technical information when you use the Service, such as IP addresses, request times, and the pages requested. This information is used to deliver the Service, keep it secure, and diagnose faults.",
          "Server-side logs are not used to set advertising or cross-site tracking cookies. How long logs are kept and how we handle them is described in our Privacy Policy."
        ]
      },
      {
        "title": "Do Not Track and similar signals",
        "paragraphs": [
          "Some browsers send a Do Not Track signal. Because we do not use cookies for advertising or cross-site tracking, we do not respond to that signal differently. Our practices are described in full on this page and in our Privacy Policy, so you can see exactly what we do."
        ]
      },
      {
        "title": "Changes to this policy",
        "paragraphs": [
          "We will update this policy when our use of cookies or local storage changes. We will post the updated version here and update the date at the top of the page. If a change affects cookies that require consent, we will ask for consent before we set them."
        ]
      },
      {
        "title": "Contact",
        "paragraphs": [
          "Questions about cookies or local storage: support@roleflow.site. For community support, visit our official community server at https://discord.gg/tKPbCXbmr9."
        ]
      }
    ]
  }
};
