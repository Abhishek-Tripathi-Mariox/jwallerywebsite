import type { NotificationItem } from "../../services/api";

/**
 * Product-level preview for an order notification — thumbnail, name, qty and
 * a "+N more items" tail when the order had more than one line item. Shared
 * by the header bell dropdown and the full /notifications page so both show
 * what was actually ordered instead of a bare "Order placed" line.
 */
export default function NotificationOrderPreview({ n }: { n: NotificationItem }) {
  const products = n.products || [];
  if (n.type !== "order" || products.length === 0) {
    return <div className="notif-item-msg">{n.message}</div>;
  }

  const first = products[0];
  const extra = products.length - 1;

  return (
    <div className="notif-order">
      <div className="notif-order-row">
        {first.productImage && (
          <img className="notif-order-thumb" src={first.productImage} alt="" />
        )}
        <div className="notif-order-line">
          <span className="notif-order-name">{first.productName}</span>
          {first.quantity ? <span className="notif-order-qty"> × {first.quantity}</span> : null}
          {extra > 0 && (
            <span className="notif-order-more">
              {" "}
              +{extra} more item{extra > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      <div className="notif-order-meta">
        {n.orderNumber && <span>Order #{n.orderNumber}</span>}
        {n.totalAmount != null && <span> · Total ₹{n.totalAmount}</span>}
      </div>
    </div>
  );
}
