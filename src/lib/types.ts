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
  user_type: 'SkillSeeker' | 'SkillHolder' | 'Both' | null;
  created_at: string;
  updated_at: string;
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

