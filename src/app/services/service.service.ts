// import { createRequest, createProposal, updateProposalStatus, updateRequestStatus, getProposalById, getRequestById } from '../dao/service.dao';
// import * as StellarSdk from 'stellar-sdk';

// const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// export const createServiceRequest = async ({ clientKey, description, budget }: { clientKey: string, description: string, budget: number }) => {
//   return await createRequest(clientKey, description, budget);
// };

// export const proposeService = async ({ requestId, providerKey, proposalText, bidAmount }: { requestId: string, providerKey: string, proposalText: string, bidAmount: number }) => {
//   return await createProposal(requestId, providerKey, proposalText, bidAmount);
// };

// export const acceptProposal = async ({ proposalId }: { proposalId: string }) => {
//   const proposal = await getProposalById(proposalId);
//   await updateProposalStatus(proposalId, 'accepted');
//   await updateRequestStatus(proposal.request_id, 'accepted');
//   return { message: 'Proposal accepted' };
// };

// export const payForService = async ({
//   proposalId,
//   clientSecret,
//   bdIssuer,
// }: {
//   proposalId: string;
//   clientSecret: string;
//   bdIssuer: string;
// }) => {
//   const proposal = await getProposalById(proposalId);
//   const request = await getRequestById(proposal.request_id);

//   if (proposal.status !== 'accepted' || request.status !== 'accepted') {
//     throw new Error('Proposal not accepted or already paid');
//   }

//   const asset = new StellarSdk.Asset('BD', bdIssuer);
//   const source = StellarSdk.Keypair.fromSecret(clientSecret);
//   const sourcePublicKey = source.publicKey();
//   const destinationPublicKey = proposal.provider_key;

//   const [sourceAccount, destinationAccount] = await Promise.all([
//     server.loadAccount(sourcePublicKey),
//     server.loadAccount(destinationPublicKey)
//   ]);

//   // Check if destination trusts the asset
//   const destinationTrustsAsset = destinationAccount.balances.some(
//     (b: any) =>
//       b.asset_code === 'BD' &&
//       b.asset_issuer === bdIssuer
//   );
//   if (!destinationTrustsAsset) {
//     throw new Error('Provider does not have a trustline to the BD asset');
//   }

//   try {
//     const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
//       fee: (await server.fetchBaseFee()).toString(),
//       networkPassphrase: StellarSdk.Networks.TESTNET
//     })
//       .addOperation(
//         StellarSdk.Operation.payment({
//           destination: destinationPublicKey,
//           asset,
//           amount: proposal.bid_amount.toString()
//         })
//       )
//       .addMemo(StellarSdk.Memo.text('Service Payment'))
//       .setTimeout(30)
//       .build();

//     tx.sign(source);
//     const result = await server.submitTransaction(tx);

//     await updateRequestStatus(request.id, 'paid');

//     return {
//       message: 'Payment successful',
//       transactionHash: result.hash
//     };
//   } catch (e: any) {
//     const resultCodes = e?.response?.data?.extras?.result_codes;
//     const reason = resultCodes?.operations?.join(', ') || resultCodes?.transaction || 'Unknown error';
//     throw new Error(`Payment failed: ${reason}`);
//   }
// };

// === src/app/services/service.service.ts ===
import {
  createRequest,
  createProposal,
  updateProposalStatus,
  updateRequestStatus,
  getProposalById,
  getRequestById
} from '../dao/service.dao';
import StellarSdk from 'stellar-sdk';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

export const createServiceRequest = async ({ clientKey, description, budget }: { clientKey: string, description: string, budget: number }) => {
  return await createRequest(clientKey, description, budget);
};

export const proposeService = async ({ requestId, providerKey, proposalText, bidAmount }: { requestId: string, providerKey: string, proposalText: string, bidAmount: number }) => {
  return await createProposal(requestId, providerKey, proposalText, bidAmount);
};

export const acceptProposal = async ({ proposalId }: { proposalId: string }) => {
  const proposal = await getProposalById(proposalId);
  await updateProposalStatus(proposalId, 'accepted');
  await updateRequestStatus(proposal.request_id, 'accepted');
  return { message: 'Proposal accepted' };
};

export const payForService = async ({
  proposalId,
  clientSecret,
  bdIssuer
}: {
  proposalId: string;
  clientSecret: string;
  bdIssuer: string;
}) => {
  const proposal = await getProposalById(proposalId);
  const request = await getRequestById(proposal.request_id);

  if (proposal.status !== 'accepted' || request.status !== 'accepted') {
    throw new Error('Proposal not accepted or already paid');
  }

  const asset = new StellarSdk.Asset('BD', bdIssuer);
  const source = StellarSdk.Keypair.fromSecret(clientSecret);
  const sourcePublicKey = source.publicKey();
  const destinationPublicKey = proposal.provider_key;

  const [sourceAccount, destinationAccount] = await Promise.all([
    server.loadAccount(sourcePublicKey),
    server.loadAccount(destinationPublicKey)
  ]);

  console.log('Destination balances:', destinationAccount.balances);

  // Improved trustline check
  const destinationTrustsAsset = destinationAccount.balances.some(
    (b: any) =>
      b.asset_type !== 'native' &&
      b.asset_code === 'BD' &&
      b.asset_issuer === 'GCJEZGVNCFA5756AMGYPDLBBAXJXQ2GEROQPGEK67VNYU6ADF5R5M7G5'
  );

  console.log("destination trust asset", destinationTrustsAsset, bdIssuer);
  

  if (!destinationTrustsAsset) {
    throw new Error('Provider does not have a trustline to the BD asset');
  }

  try {
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset,
          amount: proposal.bid_amount.toString()
        })
      )
      .addMemo(StellarSdk.Memo.text('Service Payment'))
      .setTimeout(30)
      .build();

    tx.sign(source);
    const result = await server.submitTransaction(tx);

    await updateRequestStatus(request.id, 'paid');

    return {
      message: 'Payment successful',
      transactionHash: result.hash
    };
  } catch (e: any) {
    const resultCodes = e?.response?.data?.extras?.result_codes;
    const reason = resultCodes?.operations?.join(', ') || resultCodes?.transaction || 'Unknown error';
    throw new Error(`Payment failed: ${reason}`);
  }
};
