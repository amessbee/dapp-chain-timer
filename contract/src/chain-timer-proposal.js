// @ts-check
import { E } from '@endo/far';

/**
 * @import {Installation, Instance} from '@agoric/zoe/src/zoeService/utils';
 * @import {TimerFn} from './chain-timer-contract';
 */

console.warn('start proposal module evaluating');

/**
 * Core eval script to start contract
 *
 * @param {BootstrapPowers & TimePowers} permittedPowers
 *
 * @typedef {{
 *   installation: PromiseSpaceOf<{ chainTimer: Installation<TimerFn>}>
 *   instance: PromiseSpaceOf<{ chainTimer: Instance<TimerFn>}>
 * }} TimePowers
 */
export const startChainTimerContract = async permittedPowers => {
  console.error('startChainTimerContract()...');
  const {
    consume: { chainStorage, startUpgradable, chainTimerService },
    installation: {
      consume: { chainTimer: chainTimerInstallationP },
    },
    instance: {
      produce: { chainTimer: produceInstance },
    },
  } = permittedPowers;

  // print all the powers
  console.log(
    '**************************************************',
    permittedPowers,
  );

  const storageNode = await E(chainStorage).makeChildNode('chainTimer');

  const terms = { maxTime: 100n };

  // agoricNames gets updated each time; the promise space only once XXXXXXX
  const installation = await chainTimerInstallationP;
  const clock = await E(chainTimerService).getClock();
  /** @type {Parameters<TimerFn>[1]} */
  const privateArgs = {
    storageNode,
    clock,
    timerService: chainTimerService,
  };

  const { instance } = await E(startUpgradable)({
    installation,
    label: 'chainTimer',
    terms,
    privateArgs,
  });
  console.log('CoreEval script: started contract', instance);

  produceInstance.reset();
  produceInstance.resolve(instance);
  console.log('chainTimer (re)started');
};

/** @type { import("@agoric/vats/src/core/lib-boot").BootstrapManifest } */
const chainTimerManifest = {
  [startChainTimerContract.name]: {
    consume: {
      chainStorage: true,
      chainTimerService: true,
      startUpgradable: true, // to start contract and save adminFacet
    },
    installation: { consume: { chainTimer: true } },
    instance: { produce: { chainTimer: true } },
  },
};
harden(chainTimerManifest);

export const getManifestForChainTimer = ({ restoreRef }, { chainTimerRef }) => {
  return harden({
    manifest: chainTimerManifest,
    installations: {
      chainTimer: restoreRef(chainTimerRef),
    },
  });
};
