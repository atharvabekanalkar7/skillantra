export interface User {
  id: string;
  email: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  bio: string | null;
  skills: string | null;
  college: string | null;
  phone_number: string | null;
  user_type: 'SkillSeeker' | 'SkillHolder' | 'Both' | 'recruiter' | null;
  company_name?: string | null;
  company_description?: string | null;
  company_website?: string | null;
  designation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_profile_id: string;
  content: string;
  is_read?: boolean;
  created_at: string;
}

export interface CollaborationRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface CollaborationRequestWithProfiles extends CollaborationRequest {
  sender_profile: Profile;
  receiver_profile: Profile;
}

export interface TaskAttachment {
  category: 'GitHub' | 'Figma' | 'Notion' | 'Google Drive' | 'Other';
  link: string;
}

export interface Task {
  id: string;
  creator_profile_id: string;
  title: string;
  description: string | null;
  skills_required: string | null;
  payment_type: 'stipend' | 'other' | null;
  stipend_min: number | null;
  stipend_max: number | null;
  payment_other_details: string | null;
  application_deadline: string | null;
  mode_of_work: 'remote' | 'hybrid' | 'in-person' | null;
  attachments: TaskAttachment[];
  status: 'open' | 'closed';
  created_at: string;
  creator_profile?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
    college?: string | null;
    user_type?: string | null;
    bio?: string | null;
    skills?: string | null;
    created_at?: string;
  };
}

export interface TaskApplication {
  id: string;
  task_id: string;
  applicant_profile_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  task?: Task;
  applicant?: {
    id: string;
    name: string;
    college: string | null;
    phone_number: string | null;
  };
}

export interface Internship {
  id: string;
  recruiter_id: string;
  title: string;
  company_name: string | null;
  company_logo_url: string | null;
  location: string;
  start_date: string;
  duration_months: number;
  stipend_min: number;
  stipend_max: number;
  is_unpaid: boolean;
  apply_by: string;
  number_of_openings: number;
  about_internship: string;
  skills_required: string[];
  who_can_apply: string;
  perks: string[];
  is_linkedin_mandatory: boolean;
  status: 'pending_approval' | 'approved' | 'rejected' | 'closed' | 'expired' | 'open';
  created_at?: string;

  recruiter?: Profile; // optional JOIN
}

export interface InternshipQuestion {
  id: string;
  internship_id: string;
  question_text: string;
  question_type: 'short_text' | 'long_text' | 'yes_no' | 'file_upload';
  is_required: boolean;
  order_index: number;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  student_id: string;
  resume_url: string | null;
  skillantra_resume_id: string | null;
  linkedin_url: string | null;
  cover_note: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  offer_letter_url: string | null;
  completion_letter_url: string | null;
  offer_letter_reminder_sent: boolean;

  internship?: Internship; // optional JOIN
  student?: Profile; // optional JOIN
}

export interface InternshipApplicationAnswer {
  id: string;
  application_id: string;
  question_id: string;
  answer_text: string | null;
  file_url: string | null;

  question?: InternshipQuestion; // optional JOIN
}

export interface SkillantraResume {
  id: string;
  student_id: string;
  career_objective: string | null;
  education: any[];
  work_experience: any[];
  extra_curricular: any[];
  trainings_courses: any[];
  academic_projects: any[];
  skills: string[];
  portfolio_links: any[];
  accomplishments: string | null;
  updated_at: string;
}

export type NotificationType = 'internship_accepted' | 'internship_rejected' | 'internship_applied' | 'offer_letter' | 'completion_letter' | 'admin_status';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  metadata: any;
}
