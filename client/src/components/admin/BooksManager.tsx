import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { type Book } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, ExternalLink, BookOpen } from "lucide-react";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

const bookFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  author: z.string().optional(),
  description: z.string().optional(),
  link: z.string().url({ message: "Must be a valid URL" }),
  cover_image_url: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\//.test(val), {
      message: "Must be a valid URL",
    }),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export function BooksManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    data: books,
    isLoading,
    isError,
  } = useQuery<Book[]>({
    queryKey: ["/api/admin/books"],
  });

  const addBookMutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      const response = await apiRequest("/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Book added",
        description: "The book has been published.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add book",
        description: error?.message || "An error occurred while adding the book.",
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BookFormValues> }) => {
      const response = await apiRequest(`/admin/books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsEditDialogOpen(false);
      setEditingBook(null);
      toast({
        title: "Book updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update book",
        description: error?.message || "An error occurred while updating the book.",
        variant: "destructive",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/admin/books/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      setIsDeleteDialogOpen(false);
      setDeletingBook(null);
      toast({
        title: "Book deleted",
        description: "The book has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete book",
        description: error?.message || "An error occurred while deleting the book.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Books</CardTitle>
          <CardDescription>There was a problem loading the books.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/books"] })}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Books</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Book
        </Button>
      </div>

      <BookList
        books={books || []}
        onEdit={(book) => {
          setEditingBook(book);
          setIsEditDialogOpen(true);
        }}
        onDelete={(book) => {
          setDeletingBook(book);
          setIsDeleteDialogOpen(true);
        }}
      />

      {/* Add Book Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Book</DialogTitle>
            <DialogDescription>
              Publish a book so it appears on the public Books page.
            </DialogDescription>
          </DialogHeader>

          <BookForm
            onSubmit={(data) => addBookMutation.mutate(data)}
            isSubmitting={addBookMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Update the details of this book.</DialogDescription>
          </DialogHeader>

          {editingBook && (
            <BookForm
              book={editingBook}
              onSubmit={(data) => {
                updateBookMutation.mutate({ id: editingBook.id, data });
              }}
              isSubmitting={updateBookMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deletingBook?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingBook && deleteBookMutation.mutate(deletingBook.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBookMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookList({
  books,
  onEdit,
  onDelete,
}: {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}) {
  if (books.length === 0) {
    return (
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle>No Books Found</CardTitle>
          <CardDescription>
            There are no books yet. Add one using the "Add Book" button.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {books.map((book) => (
        <Card key={book.id} className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {book.cover_image_url && (
              <div className="md:w-1/4 lg:w-1/6">
                <div className="aspect-[2/3] overflow-hidden bg-muted">
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="flex-1">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {book.title}
                      {book.is_published ? (
                        <Badge variant="secondary">Published</Badge>
                      ) : (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </CardTitle>
                    {book.author && (
                      <CardDescription>by {book.author}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(book)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(book)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {book.description && (
                  <p className="text-sm text-muted-foreground">{book.description}</p>
                )}
                <div className="mt-4 text-xs text-muted-foreground">
                  Sort order: {book.sort_order ?? 0}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <a href={book.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> View Book
                  </a>
                </Button>
              </CardFooter>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function BookForm({
  book,
  onSubmit,
  isSubmitting,
}: {
  book?: Book;
  onSubmit: (data: BookFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: book
      ? {
          title: book.title,
          author: book.author ?? "",
          description: book.description ?? "",
          link: book.link,
          cover_image_url: book.cover_image_url ?? "",
          is_published: book.is_published ?? true,
          sort_order: book.sort_order ?? 0,
        }
      : {
          title: "",
          author: "",
          description: "",
          link: "",
          cover_image_url: "",
          is_published: true,
          sort_order: 0,
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Cyber Security for Kids" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="author"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Author</FormLabel>
              <FormControl>
                <Input placeholder="Author name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A short description of the book"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormControl>
                <Input placeholder="https://www.amazon.com/..." {...field} />
              </FormControl>
              <FormDescription>Where readers can find or buy the book.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Image URL</FormLabel>
              <FormControl>
                <Input placeholder="https://...jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sort Order</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormDescription>Lower numbers appear first.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Published</FormLabel>
                <FormDescription>
                  Show this book on the public Books page.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : book ? "Save Changes" : "Add Book"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
