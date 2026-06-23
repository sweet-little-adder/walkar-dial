import streamDeck from "@elgato/streamdeck";

import { WalkStretchTimer } from "./actions/walk-stretch-timer";

streamDeck.logger.setLevel("trace");

streamDeck.actions.registerAction(new WalkStretchTimer());

streamDeck.connect();
