import { mockPosts } from "@/data/mock";
import { PostCard } from "@/components/shared/PostCard";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function Feed() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-2xl px-4 pt-24 pb-12">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Feed da Comunidade</h1>
        <div className="space-y-4">
          {mockPosts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      </div>
      <Footer />
    </div>
  );
}
