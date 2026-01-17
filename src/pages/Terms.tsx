import { StoreLayout } from "@/components/layout/StoreLayout";
import { Separator } from "@/components/ui/separator";
const Terms = () => {
  return <StoreLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Terms and Policies</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: January 2026
        </p>

        <div className="space-y-12">
          {/* Terms of Service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Terms of Service</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Welcome to Aura Edge. By accessing and using our website, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
              <h3 className="text-lg font-medium text-foreground">Use of Website</h3>
              <p>
                You agree to use this website only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the website.
              </p>
              <h3 className="text-lg font-medium text-foreground">User Accounts</h3>
              <p>
                When you create an account with us, you must provide accurate and complete information. You are responsible for safeguarding your account credentials and for any activities or actions under your account.
              </p>
            </div>
          </section>

          <Separator />

          {/* Privacy Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Privacy Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Information We Collect</h3>
              <p>
                We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us. This includes your name, email address, shipping address, and payment information.
              </p>
              <h3 className="text-lg font-medium text-foreground">How We Use Your Information</h3>
              <p>
                We use the information we collect to process transactions, send order updates, respond to your requests, and improve our services. We do not sell your personal information to third parties.
              </p>
              <h3 className="text-lg font-medium text-foreground">Data Protection</h3>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>
          </section>

          <Separator />

          {/* Shipping Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Shipping Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Delivery Timeframes</h3>
              <p>
                Orders are typically processed within 1-2 business days. Delivery times vary based on your location and shipping method selected at checkout.
              </p>
              <h3 className="text-lg font-medium text-foreground">Shipping Costs</h3>
              <p>
                Shipping costs are calculated at checkout based on your delivery address and the weight of your order. We may offer free shipping on orders above a certain value.
              </p>
              <h3 className="text-lg font-medium text-foreground">Order Tracking</h3>
              <p>
                Once your order is shipped, you will receive a tracking number via email. You can also track your order through your account dashboard.
              </p>
            </div>
          </section>

          <Separator />

          {/* Return & Refund Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Return & Refund Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Return Eligibility</h3>
              <p>
                Items may be returned within 7 days of delivery if they are unused, unwashed, and in their original packaging with all tags attached.
              </p>
              <h3 className="text-lg font-medium text-foreground">Refund Process</h3>
              <p>
                Once we receive and inspect your return, we will notify you of the approval or rejection of your refund. Approved refunds will be processed within 5-7 business days.
              </p>
              <h3 className="text-lg font-medium text-foreground">Non-Returnable Items</h3>
              <p>
                Customized products, items marked as final sale, and products that have been worn or washed are not eligible for return.
              </p>
            </div>
          </section>

          <Separator />

          {/* Payment Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Payment Terms</h2>
            <div className="space-y-4 text-muted-foreground">
              <h3 className="text-lg font-medium text-foreground">Accepted Payment Methods</h3>
              <p>
                We accept payments through Razorpay, which supports credit cards, debit cards, UPI, net banking, and various wallet options.
              </p>
              <h3 className="text-lg font-medium text-foreground">Payment Security</h3>
              <p>
                All payment transactions are processed through Razorpay's secure payment gateway. We do not store your card details on our servers.
              </p>
            </div>
          </section>

          <Separator />

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about these terms and policies, please contact us:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Email: auraedge29@gmail.com</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </StoreLayout>;
};
export default Terms;