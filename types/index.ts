// types/index.ts
export interface Series {
    id: string;
    title: string;
    slug: string;
    synopsis: string;
    cover_image_url: string;
    status: string;
    view_count: number;
    rating_avg: number;
    creator_name: string;
}

export interface Genre {
    id: number;
    name: string;
}