"use client";

import {
  useMutation,
  useQueryClient,
  type MutationFunction,
  type QueryKey
} from "@tanstack/react-query";

type Reconcile<TQueryData, TVariables, TResult> = (
  current: TQueryData | undefined,
  result: TResult,
  variables: TVariables
) => TQueryData;

type OptimisticUpdater<TQueryData, TVariables> = (
  current: TQueryData | undefined,
  variables: TVariables
) => TQueryData;

type Options<TQueryData, TVariables, TResult> = {
  queryKey: QueryKey;
  mutationFn: MutationFunction<TResult, TVariables>;
  optimisticUpdate: OptimisticUpdater<TQueryData, TVariables>;
  reconcile?: Reconcile<TQueryData, TVariables, TResult>;
  rollbackOnError?: boolean;
  invalidateOnSettled?: boolean;
  onSuccess?: (result: TResult, variables: TVariables) => void | Promise<unknown>;
  onSettled?: (result: TResult | undefined, error: Error | null, variables: TVariables) => void | Promise<unknown>;
};

type MutationContext<TQueryData> = {
  previousData: TQueryData | undefined;
};

export function useOptimisticMutation<TQueryData, TVariables, TResult>({
  queryKey,
  mutationFn,
  optimisticUpdate,
  reconcile,
  rollbackOnError = true,
  invalidateOnSettled = true
}: Options<TQueryData, TVariables, TResult>) {
  const queryClient = useQueryClient();

  return useMutation<TResult, Error, TVariables, MutationContext<TQueryData>>({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TQueryData>(queryKey);
      queryClient.setQueryData<TQueryData>(queryKey, (current) =>
        optimisticUpdate(current, variables)
      );
      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (!rollbackOnError) return;
      queryClient.setQueryData(queryKey, context?.previousData);
    },
    onSuccess: (result, variables) => {
      if (!reconcile) return;
      queryClient.setQueryData<TQueryData>(queryKey, (current) =>
        reconcile(current, result, variables)
      );
    },
    onSettled: () => {
      if (!invalidateOnSettled) return;
      queryClient.invalidateQueries({ queryKey });
    }
  });
}
