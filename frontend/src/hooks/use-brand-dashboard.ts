import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrandCampaign {
  id: string;
  title: string;
  objective: string | null;
  status: string | null;
  campaign_type: string | null;
  start_at: string | null;
  end_at: string | null;
  budget_amount: number | null;
  currency: string | null;
  created_at: string;
}

export interface BrandPost {
  id: string;
  title: string | null;
  content: string;
  status: string;
  post_type: string;
  is_sponsored: boolean;
  impressions: number;
  clicks: number;
  likes_count: number;
  shares: number;
  image_url: string | null;
  created_at: string;
  published_at: string | null;
}

export interface CampaignAsset {
  id: string;
  campaign_id: string;
  asset_type: string;
  reference_id: string | null;
  created_at: string;
}

export interface BrandProfile {
  id: string;
  company_name: string | null;
  category: string | null;
  campaign_goal: string | null;
  monthly_budget: number | null;
  target_audience_json: any;
}

export interface BrandOverview {
  activeCampaigns: number;
  completedCampaigns: number;
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
}

export function useBrandDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [campaigns, setCampaigns] = useState<BrandCampaign[]>([]);
  const [posts, setPosts] = useState<BrandPost[]>([]);
  const [assets, setAssets] = useState<CampaignAsset[]>([]);
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [overview, setOverview] = useState<BrandOverview>({
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalBudget: 0,
    totalSpent: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    avgCTR: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      setLoading(true);
      setError(false);
      try {
        const [campaignsRes, postsRes, profileRes] = await Promise.all([
          supabase
            .from("campaigns")
            .select("*")
            .eq("owner_user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("community_posts")
            .select("*")
            .eq("author_id", user.id)
            .eq("is_sponsored", true)
            .order("created_at", { ascending: false }),
          supabase
            .from("brand_profiles")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        const campaignsList = (campaignsRes.data || []) as BrandCampaign[];
        const postsList = (postsRes.data || []) as BrandPost[];
        const brandProfile = profileRes.data as BrandProfile | null;

        setCampaigns(campaignsList);
        setPosts(postsList);
        setProfile(brandProfile);

        // Fetch assets for all campaigns
        if (campaignsList.length > 0) {
          const campaignIds = campaignsList.map((c) => c.id);
          const { data: assetsData } = await supabase
            .from("campaign_assets")
            .select("*")
            .in("campaign_id", campaignIds);
          setAssets((assetsData || []) as CampaignAsset[]);
        }

        // Compute overview
        const active = campaignsList.filter((c) => c.status === "active").length;
        const completed = campaignsList.filter((c) => c.status === "completed").length;
        const totalBudget = campaignsList.reduce((s, c) => s + (c.budget_amount || 0), 0);
        const totalImpressions = postsList.reduce((s, p) => s + p.impressions, 0);
        const totalClicks = postsList.reduce((s, p) => s + p.clicks, 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

        setOverview({
          activeCampaigns: active,
          completedCampaigns: completed,
          totalBudget,
          totalSpent: totalBudget * 0.65, // estimated spend ratio
          totalImpressions,
          totalClicks,
          totalConversions: Math.round(totalClicks * 0.12),
          avgCTR: Math.round(avgCTR * 100) / 100,
        });
      } catch (err) {
        console.error("[BrandDashboard] Error loading data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [user]);

  return { loading, error, campaigns, posts, assets, profile, overview };
}
