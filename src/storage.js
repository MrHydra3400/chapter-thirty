import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const storage = {
  async get() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("chapter_thirty")
      .select("state")
      .eq("user_id", user.id)
      .single();
    return data ? { value: JSON.stringify(data.state) } : null;
  },
  async set(_key, value) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    await supabase.from("chapter_thirty").upsert({
      user_id: user.id,
      state: JSON.parse(value),
      updated_at: new Date(),
    });
    return { value };
  },
};
