import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";
import { colors, commonStyles } from "./styles";

const styles = StyleSheet.create({
  page: {
    ...commonStyles.page,
    paddingTop: 40,
    paddingBottom: 70,
  },
  header: {
    textAlign: "center",
    marginBottom: 16,
  },
  institutionName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: colors.navyBlue,
    letterSpacing: 2,
  },
  motto: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8,
    color: colors.gold,
    marginTop: 3,
  },
  address: {
    fontSize: 8,
    color: colors.mediumGray,
    marginTop: 4,
  },
  headerDivider: {
    borderBottomWidth: 2,
    borderBottomColor: colors.navyBlue,
    marginTop: 10,
    marginBottom: 4,
  },
  headerDividerThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gold,
    marginBottom: 16,
  },
  receiptTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    color: colors.navyBlue,
    textAlign: "center",
    marginBottom: 16,
    textDecoration: "underline",
  },
  statusBanner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: "center",
    marginBottom: 16,
  },
  statusBannerSuccess: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  statusBannerPending: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFC107",
  },
  statusText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    textAlign: "center",
  },
  statusTextSuccess: {
    color: "#2E7D32",
  },
  statusTextPending: {
    color: "#F57F17",
  },
  detailsSection: {
    borderWidth: 1,
    borderColor: colors.borderGray,
    borderRadius: 4,
    marginBottom: 16,
    overflow: "hidden",
  },
  detailsSectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.white,
    backgroundColor: colors.navyBlue,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailsRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.borderGray,
  },
  detailsRowAlt: {
    backgroundColor: colors.lightGray,
  },
  detailsLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.mediumGray,
    width: "40%",
  },
  detailsValue: {
    fontSize: 9,
    color: colors.darkGray,
    width: "60%",
  },
  amountSection: {
    borderWidth: 2,
    borderColor: colors.navyBlue,
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.lightGray,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    color: colors.navyBlue,
  },
  amountValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: colors.navyBlue,
  },
  noteSection: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    backgroundColor: colors.lightGray,
  },
  noteTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: colors.navyBlue,
    marginBottom: 3,
  },
  noteText: {
    fontSize: 8,
    color: colors.darkGray,
    lineHeight: 1.5,
  },
  footer: commonStyles.footer,
});

export interface PaymentReceiptData {
  studentName: string;
  studentId: string;
  programName: string;
  paymentDescription: string;
  amount: number; // in kobo
  paymentDate: string;
  paymentReference: string;
  transactionId?: string;
  paymentMethod?: string;
  status: string;
  semesterName?: string;
  sessionName?: string;
  receiptNumber: string;
}

function formatCurrency(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaymentReceiptPDF({ data }: { data: PaymentReceiptData }) {
  const isSuccess = data.status === "successful";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.institutionName}>BEREAN BIBLE ACADEMY</Text>
          <Text style={styles.motto}>
            Training Leaders for Kingdom Impact
          </Text>
          <Text style={styles.address}>
            P.O. Box 1234, Lagos, Nigeria | finance@bba.edu.ng
          </Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerDividerThin} />

        {/* Title */}
        <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>

        {/* Status Banner */}
        <View
          style={[
            styles.statusBanner,
            isSuccess ? styles.statusBannerSuccess : styles.statusBannerPending,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              isSuccess ? styles.statusTextSuccess : styles.statusTextPending,
            ]}
          >
            {isSuccess ? "PAYMENT SUCCESSFUL" : "PAYMENT " + data.status.toUpperCase()}
          </Text>
        </View>

        {/* Receipt Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Receipt Information</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Receipt Number</Text>
            <Text style={styles.detailsValue}>{data.receiptNumber}</Text>
          </View>
          <View style={[styles.detailsRow, styles.detailsRowAlt]}>
            <Text style={styles.detailsLabel}>Payment Date</Text>
            <Text style={styles.detailsValue}>{data.paymentDate}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Reference</Text>
            <Text style={styles.detailsValue}>{data.paymentReference}</Text>
          </View>
          {data.transactionId && (
            <View style={[styles.detailsRow, styles.detailsRowAlt]}>
              <Text style={styles.detailsLabel}>Transaction ID</Text>
              <Text style={styles.detailsValue}>{data.transactionId}</Text>
            </View>
          )}
          {data.paymentMethod && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Payment Method</Text>
              <Text style={styles.detailsValue}>{data.paymentMethod}</Text>
            </View>
          )}
        </View>

        {/* Student Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Student Information</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Student Name</Text>
            <Text style={styles.detailsValue}>{data.studentName}</Text>
          </View>
          <View style={[styles.detailsRow, styles.detailsRowAlt]}>
            <Text style={styles.detailsLabel}>Student ID</Text>
            <Text style={styles.detailsValue}>{data.studentId}</Text>
          </View>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Programme</Text>
            <Text style={styles.detailsValue}>{data.programName}</Text>
          </View>
          {data.sessionName && (
            <View style={[styles.detailsRow, styles.detailsRowAlt]}>
              <Text style={styles.detailsLabel}>Academic Session</Text>
              <Text style={styles.detailsValue}>{data.sessionName}</Text>
            </View>
          )}
          {data.semesterName && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Semester</Text>
              <Text style={styles.detailsValue}>{data.semesterName}</Text>
            </View>
          )}
        </View>

        {/* Payment Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Payment Details</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Description</Text>
            <Text style={styles.detailsValue}>{data.paymentDescription}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>{formatCurrency(data.amount)}</Text>
        </View>

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Important Notice</Text>
          <Text style={styles.noteText}>
            This is an electronically generated receipt and does not require a
            physical signature. For any enquiries regarding this payment, please
            contact the Finance Office at finance@bba.edu.ng with your receipt
            number.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Berean Bible Academy | Receipt No: {data.receiptNumber} | Generated
          electronically
        </Text>
      </Page>
    </Document>
  );
}
