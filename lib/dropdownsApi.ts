/*
 * Dropdown Manager is UI only in this project (no backend). The two lists below are static
 * sample data in the same format a real API would return; changes made on screen are kept in
 * memory and reset on refresh. To go live, replace the bodies of `dropdownsApi` with API calls.
 */

export interface DropdownListInfo {
  key: string;
  name: string;
  group: string;
  usedIn: string[];
  parent?: string;
  parentName?: string;
  total: number;
  active: number;
  /** Admin who last changed this list's options, and when (null until someone does) */
  updatedBy?: string | null;
  updatedAt?: string | null;
}

export interface DropdownOption {
  _id: string;
  list: string;
  label: string;
  value: string;
  parentValue: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DropdownOptionInput = {
  label: string;
  value?: string;
  parentValue?: string;
  isActive?: boolean;
};

const SEEDED_AT = "2026-01-01T00:00:00.000Z";

const STATIC_LISTS: Omit<DropdownListInfo, "total" | "active">[] = [
  { key: "enquiry_type", name: "Enquiry Type", group: "Contact", usedIn: ["Contact Us form"], updatedBy: null, updatedAt: null },
  { key: "feedback_category", name: "Feedback Category", group: "Feedback", usedIn: ["Website Feedback form"], updatedBy: null, updatedAt: null },
];

const option = (list: string, order: number, label: string): DropdownOption => ({
  _id: `${list}-${order}`,
  list,
  label,
  value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
  parentValue: "",
  order,
  isActive: true,
  createdAt: SEEDED_AT,
  updatedAt: SEEDED_AT,
});

let options: DropdownOption[] = [
  option("enquiry_type", 1, "General Enquiry"),
  option("enquiry_type", 2, "Support"),
  option("feedback_category", 1, "Website Experience"),
  option("feedback_category", 2, "Suggestion"),
];

const ofList = (list: string) => options.filter((o) => o.list === list).sort((a, b) => a.order - b.order);

const find = (id: string) => {
  const found = options.find((o) => o._id === id);
  if (!found) throw new Error("Option not found");
  return found;
};

export const dropdownsApi = {
  lists: async (): Promise<DropdownListInfo[]> =>
    STATIC_LISTS.map((list) => {
      const own = ofList(list.key);
      return { ...list, total: own.length, active: own.filter((o) => o.isActive).length };
    }),

  options: async (list: string): Promise<DropdownOption[]> => ofList(list),

  create: async (list: string, data: DropdownOptionInput): Promise<DropdownOption> => {
    const own = ofList(list);
    const now = new Date().toISOString();
    const created: DropdownOption = {
      ...option(list, (own[own.length - 1]?.order ?? 0) + 1, data.label),
      _id: `${list}-${Date.now()}`,
      ...(data.value ? { value: data.value } : {}),
      parentValue: data.parentValue ?? "",
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    options = [...options, created];
    return created;
  },

  update: async (id: string, data: Partial<DropdownOptionInput>): Promise<DropdownOption> => {
    const updated = { ...find(id), ...data, updatedAt: new Date().toISOString() } as DropdownOption;
    options = options.map((o) => (o._id === id ? updated : o));
    return updated;
  },

  remove: async (id: string): Promise<null> => {
    find(id);
    options = options.filter((o) => o._id !== id);
    return null;
  },

  reorder: async (list: string, ids: string[]): Promise<DropdownOption[]> => {
    options = options.map((o) => (o.list === list && ids.includes(o._id) ? { ...o, order: ids.indexOf(o._id) + 1 } : o));
    return ofList(list);
  },
};
