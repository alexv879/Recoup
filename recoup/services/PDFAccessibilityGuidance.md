# PDF Accessibility Guidance for Invoice Exports

To meet PDF/UA standards for accessibility, ensure all invoice exports include:

- **Document Title and Language**: Set the PDF title and language property.
- **Tagged Structure**: Use headings, tables, and lists with semantic tags.
- **Alt Text for Images**: Provide descriptive alt text for all images and logos.
- **Proper Reading Order**: Ensure content order matches logical reading sequence.
- **Accessibility Metadata**: Add author, subject, and keywords for accessibility.

## Example: jsPDF
```js
const doc = new jsPDF();
doc.setProperties({
  title: 'Invoice',
  subject: 'Invoice Export',
  author: 'Recoup',
  keywords: 'invoice, PDF/UA, accessibility',
  creator: 'Recoup'
});
// Use doc.text, doc.table, etc. with semantic structure
```

## Example: react-pdf
```jsx
<Document title="Invoice" lang="en">
  <Page>
    <Text>Invoice #123</Text>
    <Image alt="Company Logo" src={logo} />
    {/* Use semantic structure for headings, tables, etc. */}
  </Page>
</Document>
```

Refer to [PDF/UA Reference](https://www.pdfa.org/resource/pdfua-1-accessibility-standard/) for full compliance details.
