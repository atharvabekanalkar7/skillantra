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

