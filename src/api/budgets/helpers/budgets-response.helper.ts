import { BudgetOptionWithLineItems } from '@modules/budgets-db/services/budgets-db.service';
import { BudgetLineItemResponseDTO } from '../dtos/response/budget-line-item.response.dto';
import { BudgetOptionResponseDTO } from '../dtos/response/budget-option.response.dto';

/** `catalogItemId` (FK interna) nunca se expone — se reemplaza por el referenceId del catálogo. */
export function mapLineItemToResponse(
  item: BudgetOptionWithLineItems['lineItems'][number],
): BudgetLineItemResponseDTO {
  const rest: Record<string, unknown> = { ...item };
  delete rest.catalogItem;
  delete rest.catalogItemId;
  delete rest.budgetOptionId;
  rest.catalogItemReferenceId = item.catalogItem?.referenceId ?? null;
  return rest as unknown as BudgetLineItemResponseDTO;
}

export function mapOptionToResponse(
  option: BudgetOptionWithLineItems,
): BudgetOptionResponseDTO {
  const rest: Record<string, unknown> = { ...option };
  rest.lineItems = option.lineItems.map(mapLineItemToResponse);
  return rest as unknown as BudgetOptionResponseDTO;
}

export function mapOptionsToResponse(
  options: BudgetOptionWithLineItems[],
): BudgetOptionResponseDTO[] {
  return options.map(mapOptionToResponse);
}
