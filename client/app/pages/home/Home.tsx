import { includes } from "lodash";
import React, { useEffect } from "react";

import Alert from "antd/lib/alert";
import Link from "@/components/Link";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import DynamicComponent from "@/components/DynamicComponent";
import BeaconConsent from "@/components/BeaconConsent";

import { axios } from "@/services/axios";
import recordEvent from "@/services/recordEvent";
import { messages } from "@/services/auth";
import notification from "@/services/notification";
import routes from "@/services/routes";

import { DashboardAndQueryFavoritesList } from "./components/FavoritesList";

import "./Home.less";

function DeprecatedEmbedFeatureAlert() {
  return (
    <Alert
      className="m-b-15"
      type="warning"
      message={
        <>
          You have enabled <code>ALLOW_PARAMETERS_IN_EMBEDS</code>. This setting is now deprecated and should be turned
          off. Parameters in embeds are supported by default.{" "}
          <Link
            href="https://discuss.redash.io/t/support-for-parameters-in-embedded-visualizations/3337"
            target="_blank"
            rel="noopener noreferrer">
            Read more
          </Link>
          .
        </>
      }
    />
  );
}

function EmailNotVerifiedAlert() {
  const verifyEmail = () => {
    axios.post("verification_email/").then(data => {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'message' does not exist on type 'AxiosRe... Remove this comment to see the full error message
      notification.success(data.message);
    });
  };

  return (
    <Alert
      className="m-b-15"
      type="warning"
      message={
        <>
          We have sent an email with a confirmation link to your email address. Please follow the link to verify your
          email address.{" "}
          <a className="clickable" onClick={verifyEmail}>
            Resend email
          </a>
          .
        </>
      }
    />
  );
}

export default function Home() {
  useEffect(() => {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 4 arguments, but got 3.
    recordEvent("view", "page", "personal_homepage");
  }, []);

  return (
    <div className="home-page">
      <div className="container">
        {includes(messages, "using-deprecated-embed-feature") && <DeprecatedEmbedFeatureAlert />}
        {includes(messages, "email-not-verified") && <EmailNotVerifiedAlert />}
        <DynamicComponent name="Home.EmptyState">
          {/* @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call. */}
          <EmptyState
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
            header="Welcome to Redash 👋"
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
            description="Connect to any data source, easily visualize and share your data"
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'never'.
            illustration="dashboard"
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'Element' is not assignable to type 'never'.
            helpMessage={<EmptyStateHelpMessage helpTriggerType="GETTING_STARTED" />}
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
            showDashboardStep
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
            showInviteStep
            // @ts-expect-error ts-migrate(2322) FIXME: Type 'boolean' is not assignable to type 'never'.
            onboardingMode
          />
        </DynamicComponent>
        <DynamicComponent name="HomeExtra" />
        <DashboardAndQueryFavoritesList />
        <BeaconConsent />
      </div>
    </div>
  );
}

routes.register(
  "Home",
  routeWithUserSession({
    path: "/",
    title: "Redash",
    // @ts-expect-error ts-migrate(2559) FIXME: Type '{ pageTitle?: string | undefined; onError: (... Remove this comment to see the full error message
    render: pageProps => <Home {...pageProps} />,
  })
);
