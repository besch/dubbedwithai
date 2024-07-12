// pages/_app.tsx
"use client";

import { AppProps } from "next/app";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Tooltip } from "react-tooltip";
import Layout from "@/components/Layout";
import store from "@/store/store";
import "@/globals.css";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Tooltip id="dubbedWithAITooltip" />
      </Provider>
    </QueryClientProvider>
  );
}

export default MyApp;
