"use client";

import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

import store from "@/store/store";
import Container from "@/app/container";

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <Container />
      </Provider>
    </QueryClientProvider>
  );
}
