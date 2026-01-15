import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import ChatWidget from "@/app/components/ChatWidget";
import BlogContent from "@/app/components/BlogContent";
import { backendBaseUrl, frontendBaseUrl, resolveUploadUrl } from "@/lib/urls";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  content?: Record<string, any>;
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
  publishedAt?: string;
};

type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
};

async function fetchPost(slug: string): Promise<Post | null> {
  const response = await fetch(`${backendBaseUrl}/posts/${slug}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.post as Post;
}

async function fetchOtherPosts(currentSlug: string): Promise<PostSummary[]> {
  try {
    const response = await fetch(
      `${backendBaseUrl}/posts?status=published`,
      { cache: "no-store" }
    );
    if (!response.ok) return [];
    const data = await response.json();
    const posts = (data.posts || []) as PostSummary[];
    return posts.filter((post) => post.slug !== currentSlug).slice(0, 5);
  } catch {
    return [];
  }
}

async function fetchMenu(locale: string) {
  try {
    const response = await fetch(`${backendBaseUrl}/menu?locale=${locale}`, {
      cache: "no-store",
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.menu || null;
  } catch {
    return null;
  }
}

async function fetchFooter() {
  try {
    const response = await fetch(`${backendBaseUrl}/footer`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    return data.footer || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return {};
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || post.excerpt || "";
  const fallbackImage = frontendBaseUrl
    ? `${frontendBaseUrl}/og-aircon.jpg`
    : "/og-aircon.jpg";
  const image = resolveUploadUrl(
    post.seo?.image || post.coverImage || fallbackImage
  );
  const canonical = frontendBaseUrl
    ? `${frontendBaseUrl}/blog/${post.slug}`
    : `/blog/${post.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [image],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogDetail({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return notFound();
  const [menu, footer, otherPosts] = await Promise.all([
    fetchMenu(locale),
    fetchFooter(),
    fetchOtherPosts(slug),
  ]);

  return (
    <div>
      <Navbar items={menu?.items || []} cta={menu?.cta} logoUrl={menu?.logoUrl} />
      <article className="bg-slate-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-[var(--brand-navy)]">
                {post.title}
              </h1>
              {post.publishedAt && (
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(post.publishedAt).toLocaleDateString("th-TH")}
                </p>
              )}
            </div>
          {post.coverImage && (
            <img
              src={resolveUploadUrl(post.coverImage)}
              alt={post.title}
              className="w-full rounded-3xl object-cover shadow-xl shadow-blue-900/10"
            />
          )}
            {post.content && <BlogContent content={post.content} />}
          </div>
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-blue-900/10">
            <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
              บทความอื่นๆ
            </h2>
            <div className="mt-4 grid gap-4">
              {otherPosts.map((item) => (
                <a
                  key={item.id}
                  href={`/blog/${item.slug}`}
                  className="group flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="h-16 w-20 overflow-hidden rounded-xl bg-slate-100">
                    {item.coverImage ? (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-[var(--brand-blue)]">
                      {item.title}
                    </p>
                    {item.publishedAt && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        {new Date(item.publishedAt).toLocaleDateString("th-TH")}
                      </p>
                    )}
                  </div>
                </a>
              ))}
              {otherPosts.length === 0 && (
                <p className="text-xs text-slate-400">ยังไม่มีบทความอื่น</p>
              )}
            </div>
          </aside>
        </div>
      </article>
      {footer && <Footer footer={footer} />}
      <ChatWidget />
    </div>
  );
}
