export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultQuestions: Array<{
    label: string;
    description?: string;
    type: "TEXT" | "PARAGRAPH" | "SELECT" | "CHECKBOX" | "LINK" | "PORTFOLIO";
    options?: string[];
    required: boolean;
  }>;
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "roblox-developer",
    name: "Roblox Studio Developer",
    description: "Ideal for recruiting builders, programmers, 3D modelers, and animators.",
    category: "Development",
    defaultQuestions: [
      {
        label: "Primary Development Discipline",
        description: "Choose your main area of expertise in Roblox development.",
        type: "SELECT",
        options: ["Luau Scripting / Programming", "Building / Architecture", "3D Modeling (Blender)", "UI / UX Design", "Animation", "VFX & Sound"],
        required: true,
      },
      {
        label: "Portfolio or DevForum Link",
        description: "Provide a link to your Talent Hub, DevForum portfolio, or GitHub.",
        type: "PORTFOLIO",
        required: true,
      },
      {
        label: "Notable Past Projects",
        description: "List the games, groups, or studios you have previously contributed to.",
        type: "PARAGRAPH",
        required: true,
      },
      {
        label: "Weekly Availability (Hours)",
        description: "How many hours per week can you actively dedicate to this project?",
        type: "SELECT",
        options: ["5-10 hours/week", "10-20 hours/week", "20-30 hours/week", "30+ hours/week (Full-time)"],
        required: true,
      },
      {
        label: "Code or Asset Showcase",
        description: "Share a video, uncopylocked place, or image showcase link demonstrating your best work.",
        type: "LINK",
        required: false,
      },
    ],
  },
  {
    id: "discord-moderator",
    name: "Discord Staff / Moderator",
    description: "Evaluate applicant temperament, scenario responses, and activity.",
    category: "Staff & Moderation",
    defaultQuestions: [
      {
        label: "Your Timezone & Peak Online Hours",
        description: "e.g. EST (Eastern Standard Time) - 4:00 PM to 10:00 PM",
        type: "TEXT",
        required: true,
      },
      {
        label: "Prior Moderation Experience",
        description: "Have you moderated other Discord servers or Roblox groups before? Please list server sizes and roles.",
        type: "PARAGRAPH",
        required: true,
      },
      {
        label: "Scenario: Conflict Resolution",
        description: "Two members are escalating an argument in general chat and ignoring verbal warnings. How do you respond step-by-step?",
        type: "PARAGRAPH",
        required: true,
      },
      {
        label: "Scenario: Suspected Raiding / Malicious Links",
        description: "A newly joined user posts a suspicious Nitro link across multiple channels. What immediate actions do you take?",
        type: "PARAGRAPH",
        required: true,
      },
      {
        label: "I agree to maintain confidentiality regarding internal staff discussions",
        type: "CHECKBOX",
        required: true,
      },
    ],
  },
  {
    id: "event-host",
    name: "Event Host & Community Specialist",
    description: "For recruiting game night organizers, tournament directors, and hosts.",
    category: "Community",
    defaultQuestions: [
      {
        label: "Event Idea Proposal",
        description: "Pitch one unique event or tournament idea you would host for our community.",
        type: "PARAGRAPH",
        required: true,
      },
      {
        label: "Microphone & Voice Chat Comfort",
        description: "Are you comfortable speaking on stage channels and coordinating 50+ members over voice?",
        type: "SELECT",
        options: ["Very comfortable", "Somewhat comfortable", "Prefer text-only coordination"],
        required: true,
      },
      {
        label: "Past Hosting Experience",
        description: "Describe any previous events, giveaways, or tournaments you organized.",
        type: "PARAGRAPH",
        required: false,
      },
    ],
  },
];
