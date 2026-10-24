import type { CmsRecord } from "@/lib/cmsJson";

/** How a section shows in the Pages & CMS editor */
export interface ContentSectionConfig {
  key: string;
  name: string;
  itemsTitle?: string;
  addLabel?: string;
  /** New item for "Add …" */
  blank?: CmsRecord;
  /** Item fields that must be filled: [field, message] */
  required?: Array<[string, string]>;
}

export interface ContentPageConfig {
  /** Backend key: /api/cms/pages/<pageKey> */
  pageKey: string;
  /** Row in Pages & CMS (lib/cmsPages.ts) */
  cmsConfigKey: string;
  sections: ContentSectionConfig[];
  /** Hero fields joined for the default H1 */
  h1Fields: string[];
}

export const CONTENT_PAGES: ContentPageConfig[] = [
  {
    pageKey: "about-us",
    cmsConfigKey: "aboutPage",
    h1Fields: ["titleLine1", "titleHighlight"],
    sections: [
      { key: "hero", name: "Hero" },
      {
        key: "holisticCare",
        name: "Holistic Care",
        itemsTitle: "Care Pillars",
        addLabel: "Add Pillar",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every pillar needs a title."]],
      },
      {
        key: "approach",
        name: "Our Approach",
        itemsTitle: "Approach Steps",
        addLabel: "Add Step",
        blank: { number: "", title: "", description: "" },
        required: [["title", "Every step needs a title."]],
      },
      {
        key: "services",
        name: "Our Services",
        itemsTitle: "Service Cards",
        addLabel: "Add Service",
        blank: { image: "", title: "", description: "", imageAlt: "", link: "" },
        required: [["title", "Every service needs a title."]],
      },
      { key: "team", name: "Dedicated Team" },
      {
        key: "atmosphere",
        name: "Clinic Atmosphere",
        itemsTitle: "Clinic Photos",
        addLabel: "Add Photo",
        blank: { image: "", imageAlt: "" },
        required: [["imageAlt", "Every photo needs alt text."]],
      },
      { key: "cta", name: "Consultation CTA" },
    ],
  },
  {
    pageKey: "about-story",
    cmsConfigKey: "aboutStoryPage",
    h1Fields: ["titleLine1", "titleHighlight"],
    sections: [
      { key: "hero", name: "Hero — Our Story" },
      { key: "about", name: "About Vaidhyashala" },
      { key: "foundingOrganisation", name: "Founding Organisation" },
      { key: "chairmanMessage", name: "Chairman's Message" },
      {
        key: "missionVisionValues",
        name: "Mission, Vision & Values",
        itemsTitle: "Mission / Vision / Values Cards",
        addLabel: "Add Card",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every card needs a title."]],
      },
      {
        key: "services",
        name: "Our Services",
        itemsTitle: "Service Cards",
        addLabel: "Add Service",
        blank: { image: "", number: "", title: "", description: "", imageAlt: "", link: "" },
        required: [["title", "Every service needs a title."]],
      },
      {
        key: "process",
        name: "Care Process",
        itemsTitle: "Process Steps",
        addLabel: "Add Step",
        blank: { number: "", title: "", description: "" },
        required: [["title", "Every step needs a title."]],
      },
      {
        key: "clinic",
        name: "Our Clinic",
        itemsTitle: "Clinic Photos",
        addLabel: "Add Photo",
        blank: { image: "", imageAlt: "" },
        required: [["imageAlt", "Every photo needs alt text."]],
      },
      { key: "cta", name: "Next Step CTA" },
    ],
  },
  {
    pageKey: "treatments",
    cmsConfigKey: "treatmentsPage",
    h1Fields: ["titleLine1", "titleHighlight"],
    sections: [
      { key: "hero", name: "Hero" },
      {
        key: "highlights",
        name: "Highlights Strip",
        itemsTitle: "Highlights",
        addLabel: "Add Highlight",
        blank: { label: "", link: "" },
        required: [["label", "Every highlight needs its text."]],
      },
      {
        key: "careServices",
        name: "Our Treatments",
        itemsTitle: "Care Service Cards",
        addLabel: "Add Service",
        blank: { image: "", number: "", title: "", description: "", imageAlt: "", link: "" },
        required: [["title", "Every service needs a title."]],
      },
      {
        key: "healthConcerns",
        name: "Explore by Health Concern",
        itemsTitle: "Health Concerns",
        addLabel: "Add Concern",
        blank: { label: "", iconImage: "", link: "" },
        required: [["label", "Every concern needs a name."]],
      },
      {
        key: "approach",
        name: "Our Approach",
        itemsTitle: "Approach Steps",
        addLabel: "Add Step",
        blank: { number: "", title: "", description: "" },
        required: [["title", "Every step needs a title."]],
      },
      {
        key: "preparation",
        name: "Prepare for Your Consultation",
        itemsTitle: "Preparation Tips",
        addLabel: "Add Tip",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every tip needs a title."]],
      },
      {
        key: "faq",
        name: "FAQs",
        itemsTitle: "Questions & Answers",
        addLabel: "Add FAQ",
        blank: { question: "", answer: "" },
        required: [
          ["question", "Every FAQ needs a question."],
          ["answer", "Every FAQ needs an answer."],
        ],
      },
      { key: "cta", name: "Still Have Questions CTA" },
    ],
  },
  {
    pageKey: "panchakarma",
    cmsConfigKey: "panchakarmaPage",
    h1Fields: ["titleLine1", "titleHighlight"],
    sections: [
      { key: "hero", name: "Hero" },
      {
        key: "understanding",
        name: "Understanding Panchakarma",
        itemsTitle: "Steps (Preparation → Aftercare)",
        addLabel: "Add Step",
        blank: { image: "", number: "", title: "", description: "", iconImage: "", imageAlt: "" },
        required: [["title", "Every step needs a title."]],
      },
      {
        key: "classicalProcedures",
        name: "The Five Classical Procedures",
        itemsTitle: "Procedures",
        addLabel: "Add Procedure",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every procedure needs a name."]],
      },
      {
        key: "supportingTherapies",
        name: "Supporting Ayurvedic Therapies",
        itemsTitle: "Therapy Cards",
        addLabel: "Add Therapy",
        blank: { image: "", title: "", description: "", imageAlt: "", link: "#consultation" },
        required: [["title", "Every therapy needs a name."]],
      },
      {
        key: "therapyPlan",
        name: "Therapy Plan Conversation",
        itemsTitle: "Checklist Points",
        addLabel: "Add Point",
        blank: { label: "" },
        required: [["label", "Every point needs its text."]],
      },
      {
        key: "requestForm",
        name: "Request a Consultation Form",
        itemsTitle: "Therapy Options (dropdown)",
        addLabel: "Add Therapy Option",
        blank: { label: "", value: "" },
        required: [
          ["label", "Every therapy option needs a name."],
          ["value", "Every therapy option needs a value."],
        ],
      },
      {
        key: "faq",
        name: "FAQs",
        itemsTitle: "Questions & Answers",
        addLabel: "Add FAQ",
        blank: { question: "", answer: "" },
        required: [
          ["question", "Every FAQ needs a question."],
          ["answer", "Every FAQ needs an answer."],
        ],
      },
      { key: "cta", name: "Plan Your Care CTA" },
    ],
  },
  {
    // Edited by components/products-cms/ProductsEditor: categories and products are their own collections
    pageKey: "products",
    cmsConfigKey: "productsPage",
    h1Fields: ["titleLine1", "titleHighlight"],
    sections: [
      { key: "hero", name: "Hero" },
      { key: "categoryFilter", name: "Category Filter & Search", itemsTitle: "Categories (filter pills)", addLabel: "Add Category" },
      { key: "catalog", name: "Product Catalogue", itemsTitle: "Products", addLabel: "Add Product" },
      { key: "productDetails", name: "Product Details Popup (labels)" },
      {
        key: "guidance",
        name: "Choose with the Right Guidance",
        itemsTitle: "Guidance Points",
        addLabel: "Add Point",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every point needs a title."]],
      },
      {
        key: "enquiryForm",
        name: "Enquire About a Product",
        itemsTitle: "Enquiry Types (product popup form)",
        addLabel: "Add Enquiry Type",
        blank: { label: "", value: "" },
        required: [
          ["label", "Every enquiry type needs a name."],
          ["value", "Every enquiry type needs a value."],
        ],
      },
      {
        key: "faq",
        name: "FAQs",
        itemsTitle: "Questions & Answers",
        addLabel: "Add FAQ",
        blank: { question: "", answer: "" },
        required: [
          ["question", "Every FAQ needs a question."],
          ["answer", "Every FAQ needs an answer."],
        ],
      },
      { key: "cta", name: "Looking for a Product CTA" },
    ],
  },
  {
    pageKey: "contact",
    cmsConfigKey: "contactPage",
    h1Fields: ["titleLine1", "titleLine2"],
    sections: [
      { key: "hero", name: "Hero" },
      {
        key: "contactMethods",
        name: "How Can We Help You?",
        itemsTitle: "Contact Methods (Phone, WhatsApp, Email, Visit)",
        addLabel: "Add Contact Method",
        blank: { iconImage: "", title: "", description: "", value: "", buttonLabel: "", link: "" },
        required: [["title", "Every contact method needs a title."]],
      },
      {
        key: "enquiryForm",
        name: "Send Us an Enquiry Form",
        itemsTitle: "Enquiry About (dropdown options)",
        addLabel: "Add Option",
        blank: { label: "", value: "" },
        required: [
          ["label", "Every enquiry option needs a name."],
          ["value", "Every enquiry option needs a value."],
        ],
      },
      {
        key: "planVisit",
        name: "Plan Your Visit",
        itemsTitle: "Visit Details",
        addLabel: "Add Detail",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every detail needs a title."]],
      },
      { key: "location", name: "Find Our Clinic (Map)" },
      {
        key: "faq",
        name: "FAQs",
        itemsTitle: "Questions & Answers",
        addLabel: "Add FAQ",
        blank: { question: "", answer: "" },
        required: [
          ["question", "Every FAQ needs a question."],
          ["answer", "Every FAQ needs an answer."],
        ],
      },
      { key: "cta", name: "Ready to Plan Your Visit CTA" },
    ],
  },
  {
    pageKey: "privacy",
    cmsConfigKey: "privacyPolicyPage",
    h1Fields: ["title"],
    sections: [
      { key: "hero", name: "Hero" },
      {
        key: "summaryCards",
        name: "Summary Cards",
        itemsTitle: "Cards (bullets: one per line)",
        addLabel: "Add Card",
        blank: { iconImage: "", title: "", bullets: "" },
        required: [["title", "Every card needs a title."]],
      },
      {
        key: "policySections",
        name: "Policy Sections & Contents",
        itemsTitle: "Policy Sections (bullets: one per line)",
        addLabel: "Add Policy Section",
        blank: { number: "", title: "", anchorId: "", bullets: "", note: "", toBeConfirmed: false, showContactRow: false },
        required: [["title", "Every policy section needs a title."]],
      },
      {
        key: "beforeSharing",
        name: "Before Sharing Information",
        itemsTitle: "Tips",
        addLabel: "Add Tip",
        blank: { number: "", title: "", description: "" },
        required: [["title", "Every tip needs a title."]],
      },
      {
        key: "relatedLinks",
        name: "Related Links",
        itemsTitle: "Links",
        addLabel: "Add Link",
        blank: { label: "", link: "" },
        required: [
          ["label", "Every link needs a label."],
          ["link", "Every link needs a URL."],
        ],
      },
    ],
  },
  {
    pageKey: "terms",
    cmsConfigKey: "termsAndConditionsPage",
    h1Fields: ["title"],
    sections: [
      { key: "hero", name: "Hero" },
      {
        key: "summaryCards",
        name: "Summary Cards",
        itemsTitle: "Cards",
        addLabel: "Add Card",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every card needs a title."]],
      },
      {
        key: "policySections",
        name: "Terms Sections & Contents",
        itemsTitle: "Terms Sections (bullets: one per line)",
        addLabel: "Add Terms Section",
        blank: { number: "", title: "", anchorId: "", bullets: "", note: "", toBeConfirmed: false, showContactRow: false },
        required: [["title", "Every terms section needs a title."]],
      },
      {
        key: "beforeSubmitting",
        name: "Before Submitting a Request",
        itemsTitle: "Tips",
        addLabel: "Add Tip",
        blank: { number: "", title: "", description: "" },
        required: [["title", "Every tip needs a title."]],
      },
      {
        key: "relatedLinks",
        name: "Related Links",
        itemsTitle: "Links",
        addLabel: "Add Link",
        blank: { label: "", link: "" },
        required: [
          ["label", "Every link needs a label."],
          ["link", "Every link needs a URL."],
        ],
      },
    ],
  },
  {
    // Edited by components/testimonials-cms/TestimonialsEditor: the cards are their own collection
    pageKey: "testimonials",
    cmsConfigKey: "testimonialsPage",
    h1Fields: ["titleLine1", "titleLine2"],
    sections: [
      { key: "hero", name: "Hero" },
      { key: "featured", name: "Featured Testimonial (pick the card with Is Featured)" },
      {
        key: "categoryFilter",
        name: "Category Filter",
        itemsTitle: "Categories (filter pills)",
        addLabel: "Add Category",
        blank: { label: "", value: "" },
        required: [
          ["label", "Every category needs a name."],
          ["value", "Every category needs a value."],
        ],
      },
      { key: "grid", name: "Explore Patient Experiences", itemsTitle: "Testimonial Cards", addLabel: "Add Testimonial" },
      {
        key: "videoStories",
        name: "Patient Video Stories",
        itemsTitle: "Videos",
        addLabel: "Add Video",
        blank: { thumbnail: "", title: "", videoUrl: "", isSample: false },
        required: [["title", "Every video needs a title."]],
      },
      {
        key: "feedbackImpact",
        name: "What Your Feedback Helps Us Improve",
        itemsTitle: "Points",
        addLabel: "Add Point",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every point needs a title."]],
      },
      {
        key: "feedbackForm",
        name: "Share Your Experience Form",
        itemsTitle: "Service Used (dropdown options)",
        addLabel: "Add Service",
        blank: { label: "", value: "" },
        required: [
          ["label", "Every service needs a name."],
          ["value", "Every service needs a value."],
        ],
      },
      {
        key: "faq",
        name: "FAQs",
        itemsTitle: "Questions & Answers",
        addLabel: "Add FAQ",
        blank: { question: "", answer: "" },
        required: [
          ["question", "Every FAQ needs a question."],
          ["answer", "Every FAQ needs an answer."],
        ],
      },
      { key: "cta", name: "Ready to Discuss Your Care CTA" },
    ],
  },
  {
    pageKey: "careers",
    cmsConfigKey: "careersPage",
    h1Fields: ["titleLine1", "titleLine2"],
    sections: [
      { key: "hero", name: "Hero" },
      { key: "openings", name: "Current Openings" },
      {
        key: "whyWork",
        name: "Why Work With Us",
        itemsTitle: "Reasons",
        addLabel: "Add Reason",
        blank: { iconImage: "", title: "", description: "" },
        required: [["title", "Every reason needs a title."]],
      },
      {
        key: "life",
        name: "Life at Vaidhyashala",
        itemsTitle: "Photos",
        addLabel: "Add Photo",
        blank: { image: "", imageAlt: "" },
        required: [["imageAlt", "Every photo needs alt text."]],
      },
      { key: "shareProfile", name: "Don't See the Right Role Banner" },
    ],
  },
];

export const getContentPageConfig = (cmsConfigKey?: string) =>
  CONTENT_PAGES.find((p) => p.cmsConfigKey === cmsConfigKey);
