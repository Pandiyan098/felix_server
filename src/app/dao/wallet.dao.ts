interface Wallet {
  label: 'sender' | 'receiver';
  publicKey: string;
  secret: string;
}

let inMemoryWallets: Record<'sender' | 'receiver', Wallet> = {
  sender: { label: 'sender', publicKey: '', secret: '' },
  receiver: { label: 'receiver', publicKey: '', secret: '' },
};

export const saveWallet = async (label: 'sender' | 'receiver', publicKey: string, secret: string): Promise<Wallet> => {
  const wallet = { label, publicKey, secret };
  inMemoryWallets[label] = wallet;
  return wallet;
};

export const getWallets = () => {
  return inMemoryWallets;
};
