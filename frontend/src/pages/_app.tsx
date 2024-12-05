"use client";

import Head from "next/head";
import { AppProps } from "next/app";
import { Provider } from "react-redux";
import { Tooltip } from "react-tooltip";
import Layout from "@/components/Layout";
import store from "@/store/store";
import "@/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <Layout>
        <Head>
          <link rel="icon" href="/images/favicon.ico" />
          <link rel="apple-touch-icon" href="/images/favicon.ico" />
          <meta name="theme-color" content="#000000" />
        </Head>
        <Head>
          {/* Google tag (gtag.js) */}
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-DMGXYT8CKM"
          ></script>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                          window.dataLayer = window.dataLayer || [];
                          function gtag(){dataLayer.push(arguments);}
                          gtag('js', new Date());
                          gtag('config', 'G-DMGXYT8CKM');
                      `,
            }}
          />
        </Head>
        <Component {...pageProps} />
      </Layout>
      <Tooltip id="dubbedWithAITooltip" />
    </Provider>
  );
}

export default MyApp;
