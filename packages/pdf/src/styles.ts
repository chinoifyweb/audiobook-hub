import { StyleSheet, Font } from "@react-pdf/renderer";

// Common colors used across BBA documents
export const colors = {
  navyBlue: "#1B2A4A",
  darkBlue: "#0D1B36",
  gold: "#C5A54E",
  lightGray: "#F5F5F5",
  mediumGray: "#999999",
  darkGray: "#333333",
  black: "#000000",
  white: "#FFFFFF",
  borderGray: "#CCCCCC",
  watermarkGray: "#E8E8E8",
};

// Common styles reused across templates
export const commonStyles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: colors.darkGray,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  headerBar: {
    backgroundColor: colors.navyBlue,
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginTop: -40,
    marginHorizontal: -50,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    color: colors.white,
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.gold,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    color: colors.navyBlue,
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.navyBlue,
    paddingBottom: 4,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: colors.mediumGray,
    marginBottom: 2,
  },
  value: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: colors.darkGray,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 50,
    right: 50,
    textAlign: "center",
    fontSize: 8,
    color: colors.mediumGray,
    borderTopWidth: 1,
    borderTopColor: colors.borderGray,
    paddingTop: 8,
  },
  watermark: {
    position: "absolute",
    top: "35%",
    left: "15%",
    fontSize: 60,
    color: colors.watermarkGray,
    opacity: 0.15,
    transform: "rotate(-30deg)",
    fontFamily: "Helvetica-Bold",
  },
});
