import { create } from 'zustand';

// Hum ek blank structure setup kar rahe hain jo hamare naye mongoose schema se exactly match karta hai.
const initialResumeData = {
  title: "Untitled Resume",
  professionalTitle: "",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    location: ""
  },
  summary: "",
  education: [], // Items: { institution, degree, startDate, endDate, grade, description }
  experience: [], // Items: { company, position, location, startDate, endDate, description }
  projects: [],   // Items: { title, techStack, link, description }
  skills: "", 
  certifications: [],
  languages: "",
  customSections: []
};

export const useResumeStore = create((set) => ({
  resumeData: initialResumeData,

  // Simple string/object values ko update karne ke liye
  updateField: (field, value) => set((state) => ({
    resumeData: { ...state.resumeData, [field]: value }
  })),

  // Nested object (jaise personalInfo) ko update karne ke liye
  updateNestedField: (parent, field, value) => set((state) => ({
    resumeData: {
      ...state.resumeData,
      [parent]: { ...state.resumeData[parent], [field]: value }
    }
  })),

  // Arrays (Education, Experience, Projects) me naya item jodne ke liye
  addArrayItem: (field, itemTemplate) => set((state) => ({
    resumeData: {
      ...state.resumeData,
      [field]: [...state.resumeData[field], itemTemplate]
    }
  })),

  // Arrays me existing item ko edit karne ke liye
  updateArrayItem: (field, index, subField, value) => set((state) => {
    const newArray = [...state.resumeData[field]];
    newArray[index] = { ...newArray[index], [subField]: value };
    return { resumeData: { ...state.resumeData, [field]: newArray } };
  }),

  // Arrays se item delete karne ke liye
  removeArrayItem: (field, index) => set((state) => ({
    resumeData: {
      ...state.resumeData,
      [field]: state.resumeData[field].filter((_, i) => i !== index)
    }
  })),

  // Pura form clear karne ke liye (jab create ho jaye tab call karenge)
  resetForm: () => set({ resumeData: initialResumeData }),
}));