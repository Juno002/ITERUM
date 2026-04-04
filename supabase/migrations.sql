-- ITERUM RELATIONAL SCHEMA
-- Phase 2: Security & Persistence

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    total_exp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    discipline_exp INTEGER DEFAULT 0,
    discipline_level INTEGER DEFAULT 1,
    consistency_exp INTEGER DEFAULT 0,
    consistency_level INTEGER DEFAULT 1,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. HABITS
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily',
    type TEXT DEFAULT 'yesno',
    target_value INTEGER,
    unit TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HABIT LOGS
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    habit_id UUID REFERENCES public.habits ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT TRUE,
    value INTEGER,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium',
    type TEXT DEFAULT 'task',
    color TEXT,
    habit_id UUID, -- Optional link to habit
    objective_id UUID, -- Optional link to objective
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. OBJECTIVES
CREATE TABLE IF NOT EXISTS public.objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value INTEGER DEFAULT 100,
    current_value INTEGER DEFAULT 0,
    unit TEXT DEFAULT '%',
    deadline TIMESTAMP WITH TIME ZONE,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    objective_id UUID REFERENCES public.objectives ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES (Users only see their own data)

-- Profile Policies
CREATE POLICY "Users can see their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Habits Policies
CREATE POLICY "Users can manage their own habits" ON public.habits 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Habit Logs Policies
CREATE POLICY "Users can manage their own habit logs" ON public.habit_logs 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Tasks Policies
CREATE POLICY "Users can manage their own tasks" ON public.tasks 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Objectives Policies
CREATE POLICY "Users can manage their own objectives" ON public.objectives 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Milestones Policies
CREATE POLICY "Users can manage their own milestones" ON public.milestones 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
