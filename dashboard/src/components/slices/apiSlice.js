// apiSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Create an API slice
export const stakingApi = createApi({
  reducerPath: 'stakingApi', // Unique identifier for this API slice
  baseQuery: fetchBaseQuery({ baseUrl: 'https://your-staking-api.com/api/' }), // Define the API endpoint
  endpoints: (builder) => ({
    getStakedBalance: builder.query({
      query: () => 'staked-balance', // Endpoint for fetching staked balance
    }),
    stakeTokens: builder.mutation({
      query: (data) => ({
        url: 'stake', // Endpoint for staking tokens
        method: 'POST',
        body: data,
      }),
    }),
    withdrawStake: builder.mutation({
      query: () => 'withdraw', // Endpoint for withdrawing staked tokens
      method: 'POST',
    }),
  }),
});

// Export generated endpoint hooks
export const { useGetStakedBalanceQuery, useStakeTokensMutation, useWithdrawStakeMutation } = stakingApi;
