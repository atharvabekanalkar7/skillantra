# SkillAntra Database Requirements Checklist

This checklist documents all required database components for SkillAntra to function correctly. Use this to manually verify your Supabase database state.

---

## 1. Required Tables

### 1.1 `profiles`
**Purpose:** User profile information linked to Supabase Auth users

**Required Columns:**
- `id` (UUID, PRIMARY KEY) - Unique profile identifier
- `user_id` (UUID, NOT NULL, UNIQUE) - Foreign key to `auth.users(id)`
- `name` (TEXT, NOT NULL) - User's full name
- `bio` (TEXT, nullable) - User biography/description
- `skills` (TEXT, nullable) - User skills
- `college` (TEXT, nullable) - User's college/institution
- `user_type` (TEXT, nullable) - User type: 'SkillSeeker', 'SkillHolder', or 'Both'
- `phone_number` (TEXT, nullable) - Phone number (10-15 digits, numeric only)
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Profile creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Profile last update timestamp

**Required Constraints:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `user_id`
- FOREIGN KEY: `user_id` REFERENCES `auth.users(id)` ON DELETE CASCADE
- CHECK constraint on `user_type`: must be 'SkillSeeker', 'SkillHolder', or 'Both' (or NULL)
- CHECK constraint on `phone_number`: if not NULL, must match pattern `^[0-9]{10,15}$`

---

### 1.2 `tasks`
**Purpose:** Tasks/projects posted by users seeking skills

**Required Columns:**
- `id` (UUID, PRIMARY KEY) - Unique task identifier
- `creator_profile_id` (UUID, NOT NULL) - Foreign key to `profiles(id)`
- `title` (TEXT, NOT NULL) - Task title
- `description` (TEXT, nullable) - Task description
- `skills_required` (TEXT, nullable) - Required skills for the task
- `stipend_min` (INTEGER, nullable) - Minimum stipend amount
- `stipend_max` (INTEGER, nullable) - Maximum stipend amount
- `status` (TEXT, NOT NULL, DEFAULT 'open') - Task status
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Task creation timestamp

**Required Constraints:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `creator_profile_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- CHECK constraint on `status`: must be 'open' or 'closed'

---

### 1.3 `task_applications`
**Purpose:** Applications submitted by users for tasks

**Required Columns:**
- `id` (UUID, PRIMARY KEY) - Unique application identifier
- `task_id` (UUID, NOT NULL) - Foreign key to `tasks(id)`
- `applicant_profile_id` (UUID, NOT NULL) - Foreign key to `profiles(id)`
- `status` (TEXT, NOT NULL, DEFAULT 'pending') - Application status
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Application creation timestamp

**Required Constraints:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `task_id` REFERENCES `tasks(id)` ON DELETE CASCADE
- FOREIGN KEY: `applicant_profile_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- UNIQUE constraint on (`task_id`, `applicant_profile_id`) - Prevents duplicate applications
- CHECK constraint on `status`: must be 'pending', 'accepted', or 'rejected'

---

### 1.4 `collaboration_requests`
**Purpose:** Direct collaboration requests between users (separate from task applications)

**Required Columns:**
- `id` (UUID, PRIMARY KEY) - Unique request identifier
- `sender_id` (UUID, NOT NULL) - Foreign key to `profiles(id)` (sender)
- `receiver_id` (UUID, NOT NULL) - Foreign key to `profiles(id)` (receiver)
- `status` (TEXT, NOT NULL, DEFAULT 'pending') - Request status
- `message` (TEXT, nullable) - Optional message from sender
- `created_at` (TIMESTAMPTZ, NOT NULL, DEFAULT NOW()) - Request creation timestamp
- `responded_at` (TIMESTAMPTZ, nullable) - Timestamp when request was responded to

**Required Constraints:**
- PRIMARY KEY on `id`
- FOREIGN KEY: `sender_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- FOREIGN KEY: `receiver_id` REFERENCES `profiles(id)` ON DELETE CASCADE
- CHECK constraint: `sender_id != receiver_id` (no self-requests)
- CHECK constraint on `status`: must be 'pending', 'accepted', or 'rejected'
- UNIQUE constraint on (`sender_id`, `receiver_id`) WHERE `status = 'pending'` - Prevents duplicate pending requests

---

## 2. Required Triggers & Functions

### 2.1 `handle_new_user()` Function
**Purpose:** Automatically creates a profile when a user's email is confirmed

**Runs On:**
- `AFTER UPDATE OF email_confirmed_at ON auth.users` (when email_confirmed_at changes from NULL to NOT NULL)
- `AFTER INSERT ON auth.users` (when user is created with email_confirmed_at already set)

**What It Guarantees:**
- Creates a profile in `profiles` table when user email is confirmed
- Extracts `full_name` and `college` from `raw_user_meta_data`
- Prevents duplicate profile creation (checks if profile already exists)
- Uses `SECURITY DEFINER` to bypass RLS

**Trigger Names:**
- `on_auth_user_confirmed` (on UPDATE)
- `on_auth_user_created` (on INSERT)

---

### 2.2 `handle_auth_user_deleted()` Function
**Purpose:** Cascade deletes profile when auth user is deleted (soft delete via deleted_at)

**Runs On:**
- `AFTER UPDATE ON auth.users` (when `deleted_at` changes from NULL to NOT NULL)

**What It Guarantees:**
- Deletes profile when auth user is soft-deleted (deleted_at is set)
- Ensures data cleanup even if CASCADE doesn't fire immediately
- Uses `SECURITY DEFINER` to bypass RLS

**Trigger Name:**
- `trigger_auth_user_deleted`

**Note:** The FOREIGN KEY with `ON DELETE CASCADE` should also handle this, but the trigger provides an additional safety mechanism.

---

## 3. Required RLS Policies

### 3.1 `profiles` Table
**RLS Must Be Enabled:** YES

**Required Policies:**

1. **SELECT Policy (`profiles_select_policy`)**
   - **Purpose:** Allow anyone to read all profiles
   - **Rule:** `USING (true)` - No restrictions

2. **INSERT Policy (`profiles_insert_policy`)**
   - **Purpose:** Users can only create their own profile
   - **Rule:** `WITH CHECK (user_id = auth.uid())`

3. **UPDATE Policy (`profiles_update_policy`)**
   - **Purpose:** Users can only update their own profile
   - **Rule:** `USING (user_id = auth.uid()) AND WITH CHECK (user_id = auth.uid())`

4. **DELETE Policy (`profiles_delete_policy`)**
   - **Purpose:** Users can only delete their own profile
   - **Rule:** `USING (user_id = auth.uid())`

---

### 3.2 `tasks` Table
**RLS Must Be Enabled:** YES

**Required Policies:**

1. **SELECT Policy (`tasks_select_policy`)**
   - **Purpose:** Any authenticated user can view all tasks
   - **Rule:** `USING (auth.role() = 'authenticated')`

2. **INSERT Policy (`tasks_insert_policy`)**
   - **Purpose:** Users can only create tasks for their own profile
   - **Rule:** `WITH CHECK (creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

3. **UPDATE Policy (`tasks_update_policy`)**
   - **Purpose:** Only task creator can update their tasks
   - **Rule:** `USING (creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) AND WITH CHECK (creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

4. **DELETE Policy (`tasks_delete_policy`)**
   - **Purpose:** Only task creator can delete their tasks
   - **Rule:** `USING (creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

---

### 3.3 `task_applications` Table
**RLS Must Be Enabled:** YES

**Required Policies:**

1. **SELECT Policy (`task_applications_select_policy`)**
   - **Purpose:** Applicant OR task creator can view applications
   - **Rule:** `USING (applicant_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR task_id IN (SELECT id FROM tasks WHERE creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())))`

2. **INSERT Policy (`task_applications_insert_policy`)**
   - **Purpose:** Users can only create applications for their own profile
   - **Rule:** `WITH CHECK (applicant_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

3. **UPDATE Policy (`task_applications_update_policy`)**
   - **Purpose:** Only task creator can update application status (accept/reject)
   - **Rule:** `USING (task_id IN (SELECT id FROM tasks WHERE creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))) AND WITH CHECK (task_id IN (SELECT id FROM tasks WHERE creator_profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())))`

4. **DELETE Policy:**
   - **Purpose:** Not explicitly required by code
   - **Note:** Deletions happen via CASCADE when task is deleted

---

### 3.4 `collaboration_requests` Table
**RLS Must Be Enabled:** YES

**Required Policies:**

1. **SELECT Policy (`requests_select_policy`)**
   - **Purpose:** Sender OR receiver can view requests
   - **Rule:** `USING (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

2. **INSERT Policy (`requests_insert_policy`)**
   - **Purpose:** Users can only send requests from their own profile
   - **Rule:** `WITH CHECK (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

3. **UPDATE Policy (`requests_update_policy`)**
   - **Purpose:** Sender OR receiver can update requests (receiver accepts/rejects)
   - **Rule:** `USING (receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid())) AND WITH CHECK (receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

4. **DELETE Policy (`requests_delete_policy`)**
   - **Purpose:** Sender OR receiver can delete requests
   - **Rule:** `USING (sender_id = (SELECT id FROM profiles WHERE user_id = auth.uid()) OR receiver_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))`

---

## 4. Required Indexes

### 4.1 `profiles` Table Indexes

1. **`idx_profiles_user_id`**
   - **On Column:** `user_id`
   - **Why Needed:** Critical for performance - all queries filter by user_id to find user's profile. Required for RLS policy lookups.

---

### 4.2 `tasks` Table Indexes

1. **`idx_tasks_creator_profile_id`**
   - **On Column:** `creator_profile_id`
   - **Why Needed:** Required for queries filtering tasks by creator. Used in RLS policies and application queries.

2. **`idx_tasks_status`**
   - **On Column:** `status`
   - **Why Needed:** Required for filtering open/closed tasks. Used in main task listing queries.

3. **`idx_tasks_created_at`**
   - **On Column:** `created_at DESC`
   - **Why Needed:** Required for ordering tasks by creation date (newest first). Used in all task listing queries.

4. **`idx_tasks_creator_status` (Composite)**
   - **On Columns:** `creator_profile_id, status`
   - **Why Needed:** Performance optimization for queries filtering by creator AND status (e.g., "my open tasks").

---

### 4.3 `task_applications` Table Indexes

1. **`idx_task_applications_task_id`**
   - **On Column:** `task_id`
   - **Why Needed:** Required for queries finding all applications for a task. Used in RLS policies.

2. **`idx_task_applications_applicant_profile_id`**
   - **On Column:** `applicant_profile_id`
   - **Why Needed:** Required for queries finding all applications by a user. Used in RLS policies and application listing.

3. **`idx_task_applications_status`**
   - **On Column:** `status`
   - **Why Needed:** Performance optimization for filtering applications by status.

4. **`idx_task_applications_task_applicant` (Composite)**
   - **On Columns:** `task_id, applicant_profile_id`
   - **Why Needed:** Required for checking duplicate applications (enforces UNIQUE constraint efficiently). Critical for preventing duplicate applications.

---

### 4.4 `collaboration_requests` Table Indexes

1. **`idx_collaboration_requests_sender_status` (Composite)**
   - **On Columns:** `sender_id, status`
   - **Why Needed:** Performance optimization for queries finding sent requests by status. Used in requests listing.

2. **`idx_collaboration_requests_receiver_status` (Composite)**
   - **On Columns:** `receiver_id, status`
   - **Why Needed:** Performance optimization for queries finding received requests by status. Used in requests listing.

---

## 5. Migration Coverage Checklist

Based on the codebase analysis, the following migration files/types must exist:

### 5.1 Core Schema Migrations

- ✅ **Profiles table migration**
  - Creates `profiles` table with all columns
  - Sets up FOREIGN KEY to `auth.users`
  - Adds CHECK constraints for `user_type` and `phone_number`

- ✅ **College column migration**
  - Adds `college` column to `profiles` (if not in initial migration)

- ✅ **User type column migration**
  - Adds `user_type` column to `profiles` (if not in initial migration)

- ✅ **Phone number column migration**
  - Adds `phone_number` column to `profiles`
  - Adds CHECK constraint for phone number format

### 5.2 Tasks & Applications Migrations

- ✅ **Tasks table migration**
  - Creates `tasks` table with all columns including `stipend_min` and `stipend_max`
  - Sets up FOREIGN KEY to `profiles`
  - Creates all required indexes

- ✅ **Task applications table migration**
  - Creates `task_applications` table
  - Sets up FOREIGN KEYs to `tasks` and `profiles`
  - Creates UNIQUE constraint on (task_id, applicant_profile_id)
  - Creates all required indexes

### 5.3 Collaboration Requests Migration

- ✅ **Collaboration requests table migration**
  - Creates `collaboration_requests` table
  - Sets up FOREIGN KEYs to `profiles`
  - Creates CHECK constraint preventing self-requests
  - Creates UNIQUE constraint on pending requests
  - Creates required indexes

### 5.4 Auth-Related Migrations

- ✅ **Profile auto-creation trigger migration**
  - Creates `handle_new_user()` function
  - Creates `on_auth_user_confirmed` trigger
  - Creates `on_auth_user_created` trigger

- ✅ **Cascade delete trigger migration**
  - Creates `handle_auth_user_deleted()` function
  - Creates `trigger_auth_user_deleted` trigger

### 5.5 RLS Policies Migrations

- ✅ **Profiles RLS policies migration**
  - Enables RLS on `profiles`
  - Creates SELECT, INSERT, UPDATE, DELETE policies

- ✅ **Tasks RLS policies migration**
  - Enables RLS on `tasks`
  - Creates SELECT, INSERT, UPDATE, DELETE policies

- ✅ **Task applications RLS policies migration**
  - Enables RLS on `task_applications`
  - Creates SELECT, INSERT, UPDATE policies

- ✅ **Collaboration requests RLS policies migration**
  - Enables RLS on `collaboration_requests`
  - Creates SELECT, INSERT, UPDATE, DELETE policies

### 5.6 Indexes Migrations

- ✅ **Profiles indexes migration**
  - Creates `idx_profiles_user_id`

- ✅ **Tasks indexes migration**
  - Creates all task-related indexes

- ✅ **Task applications indexes migration**
  - Creates all task_applications-related indexes

- ✅ **Collaboration requests indexes migration**
  - Creates all collaboration_requests-related indexes

---

## 6. Additional Requirements

### 6.1 Extensions
- **`uuid-ossp`** extension must be enabled for UUID generation

### 6.2 Foreign Key Cascades
All foreign keys must have `ON DELETE CASCADE`:
- `profiles.user_id` → `auth.users(id)`
- `tasks.creator_profile_id` → `profiles(id)`
- `task_applications.task_id` → `tasks(id)`
- `task_applications.applicant_profile_id` → `profiles(id)`
- `collaboration_requests.sender_id` → `profiles(id)`
- `collaboration_requests.receiver_id` → `profiles(id)`

### 6.3 Supabase Auth Configuration
- Email confirmation must be enabled in Supabase Dashboard
- Site URL must be configured
- Redirect URLs must include `/auth/callback`

---

## Verification Steps

1. **Check Tables:** Verify all 4 tables exist with correct columns
2. **Check Constraints:** Verify all PRIMARY KEYs, FOREIGN KEYs, UNIQUE, and CHECK constraints
3. **Check Triggers:** Verify both trigger functions exist and triggers are attached
4. **Check RLS:** Verify RLS is enabled on all tables and all policies exist
5. **Check Indexes:** Verify all required indexes exist
6. **Test Profile Creation:** Sign up a user and verify profile is auto-created
7. **Test Cascade Delete:** Delete a user and verify profile is cascade deleted
8. **Test RLS:** Verify users can only access/modify their own data

---

**Last Updated:** Based on codebase analysis of SkillAntra project

