import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/config";

export interface Card {
  id: string;
  deckId: string;
  front: string;
  back: string;
  sourcePageNum: number | null;
  sortOrder: number;
  media: CardMedia[];
}

export interface CardMedia {
  id: string;
  cardId: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
}

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  sourceFileKey: string | null;
  sourceFileName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  cards?: Card[];
  _count?: { cards: number };
}

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface GenerationMeta {
  page_count: number;
  processing_time_seconds: number;
  card_count: number;
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("ankify_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Deck", "DeckList"],
  endpoints: (builder) => ({
    getMe: builder.query<{ user: User }, void>({
      query: () => "/auth/me",
    }),

    getDecks: builder.query<{ decks: Deck[] }, void>({
      query: () => "/decks",
      providesTags: ["DeckList"],
    }),

    getDeck: builder.query<{ deck: Deck }, string>({
      query: (id) => `/decks/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Deck" as const, id }],
    }),

    createDeck: builder.mutation<{ deck: Deck }, { name: string; file?: File }>(
      {
        query: ({ name, file }) => {
          const formData = new FormData();
          formData.append("name", name);
          if (file) formData.append("file", file);
          return { url: "/decks", method: "POST", body: formData };
        },
        invalidatesTags: ["DeckList"],
      },
    ),

    updateDeck: builder.mutation<
      { deck: Deck },
      { id: string; name?: string; description?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/decks/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Deck" as const, id },
        "DeckList",
      ],
    }),

    deleteDeck: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/decks/${id}`, method: "DELETE" }),
      invalidatesTags: ["DeckList"],
    }),

    updateCard: builder.mutation<
      { card: Card },
      { deckId: string; cardId: string; front?: string; back?: string }
    >({
      query: ({ deckId, cardId, ...body }) => ({
        url: `/decks/${deckId}/cards/${cardId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { deckId }) => [
        { type: "Deck" as const, id: deckId },
      ],
    }),

    deleteCard: builder.mutation<
      { success: boolean },
      { deckId: string; cardId: string }
    >({
      query: ({ deckId, cardId }) => ({
        url: `/decks/${deckId}/cards/${cardId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, { deckId }) => [
        { type: "Deck" as const, id: deckId },
      ],
    }),

    generateDeck: builder.mutation<
      { deck: Deck; generation: GenerationMeta },
      string
    >({
      query: (deckId) => ({
        url: `/generate/deck/${deckId}`,
        method: "POST",
      }),
      invalidatesTags: (_result, _err, deckId) => [
        { type: "Deck" as const, id: deckId },
        "DeckList",
      ],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetDecksQuery,
  useGetDeckQuery,
  useCreateDeckMutation,
  useUpdateDeckMutation,
  useDeleteDeckMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useGenerateDeckMutation,
} = api;
